const Exam = require('../../models/client/Exam');
const Marks = require('../../models/client/Marks');
const ReportCard = require('../../models/client/ReportCard');
const Student = require('../../models/client/Student');
const Subject = require('../../models/client/Subject');
const Grade = require('../../models/client/Grade');
const AuditLog = require('../../models/client/Log');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { calculateGrade, getCBCGradeAndRemark } = require('../../utils/helpers');
const logger = require('../../utils/logger');

const isAdminPrincipalDeputy = (role) => ['school_admin', 'principal', 'deputy_principal'].includes(role);
const isAdmin = (role) => role === 'school_admin';
const canEnterMarks = (role) => ['school_admin', 'principal', 'deputy_principal', 'teacher'].includes(role);

// ═══════════ EXAMS ═══════════
const getExams = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.schoolId };
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;
  if (req.query.type) filter.type = req.query.type;
  return success(res, await Exam.find(filter).sort({ createdAt: -1 }));
});

const createExam = asyncHandler(async (req, res) => {
  if (!isAdminPrincipalDeputy(req.user.role)) return error(res, 'Access denied', 403);
  const exam = await Exam.create({ ...req.body, schoolId: req.schoolId });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'exam_created', details: exam.name, ip: req.ip });
  return success(res, exam, 'Exam created', 201);
});

const updateExam = asyncHandler(async (req, res) => {
  if (!isAdminPrincipalDeputy(req.user.role)) return error(res, 'Access denied', 403);
  const exam = await Exam.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, req.body, { new: true });
  if (!exam) return error(res, 'Exam not found', 404);
  return success(res, exam, 'Exam updated');
});

const deleteExam = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  await Exam.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  await Marks.deleteMany({ examId: req.params.id });
  await ReportCard.deleteMany({ examId: req.params.id });
  return success(res, null, 'Exam deleted');
});

const publishExam = asyncHandler(async (req, res) => {
  if (!isAdminPrincipalDeputy(req.user.role)) return error(res, 'Access denied', 403);
  return success(res, await Exam.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, { isPublished: true }, { new: true }), 'Exam published');
});

// ═══════════ MARKS ENTRY ═══════════
const getSubjectsForMarks = asyncHandler(async (req, res) => {
  const { examId, grade } = req.query;
  if (!examId || !grade) return error(res, 'Exam and grade required', 400);
  const exam = await Exam.findById(examId);
  if (!exam) return error(res, 'Exam not found', 404);
  const gradeDoc = await Grade.findOne({ schoolId: req.schoolId, name: grade });
  if (!gradeDoc) return error(res, 'Grade not found', 404);
  const filter = { schoolId: req.schoolId, gradeId: gradeDoc._id };
  if (req.user.role === 'teacher') filter.$or = [{ teacherId: req.user.id }, { teacherId: { $in: [null, undefined] } }];
  return success(res, { exam: { _id: exam._id, name: exam.name, type: exam.type }, subjects: await Subject.find(filter).select('name code') });
});

const getStudentsForMarks = asyncHandler(async (req, res) => {
  const { examId, subjectId, grade, section } = req.query;
  if (!examId || !subjectId) return error(res, 'Exam and subject required', 400);
  const filter = { schoolId: req.schoolId, isActive: true };
  if (grade) filter.grade = grade;
  if (section) filter.section = section;
  const students = await Student.find(filter).select('firstName lastName studentId admissionNumber grade section').sort({ firstName: 1 });
  const marks = await Marks.find({ schoolId: req.schoolId, examId, subjectId, studentId: { $in: students.map(s => s._id) } });
  return success(res, students.map(s => {
    const m = marks.find(x => x.studentId.toString() === s._id.toString());
    const { grade, remark } = m ? getCBCGradeAndRemark(m.marksObtained, m.totalMarks) : { grade: '', remark: '' };
    return { ...s.toObject(), marksObtained: m?.marksObtained || '', totalMarks: m?.totalMarks || 100, grade, remark, isSubmitted: m?.status === 'submitted' };
  }));
});

const saveMarks = asyncHandler(async (req, res) => {
  if (!canEnterMarks(req.user.role)) return error(res, 'Access denied', 403);
  const { examId, subjectId, marks: marksData } = req.body;
  if (!examId || !subjectId || !marksData) return error(res, 'Exam, subject and marks required', 400);
  for (const m of marksData) {
    if (!m.studentId || m.marksObtained === '' || m.marksObtained === undefined) continue;
    const { grade, remark } = getCBCGradeAndRemark(Number(m.marksObtained), m.totalMarks || 100);
    await Marks.findOneAndUpdate({ schoolId: req.schoolId, examId, subjectId, studentId: m.studentId }, { marksObtained: Number(m.marksObtained), totalMarks: m.totalMarks || 100, grade, remark, enteredBy: req.user.id }, { upsert: true, new: true });
  }
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'marks_saved', details: `${marksData.length} students`, ip: req.ip });
  return success(res, { count: marksData.length }, 'Marks saved');
});

const submitMarks = asyncHandler(async (req, res) => {
  const { examId, subjectId } = req.body;
  await Marks.updateMany({ schoolId: req.schoolId, examId, subjectId }, { status: 'submitted' });
  return success(res, null, 'Marks submitted');
});

// ═══════════ TERM AVERAGE ═══════════
const getTermAverage = asyncHandler(async (req, res) => {
  const { term, academicYear, grade, section } = req.query;
  if (!term || !academicYear) return error(res, 'Term and academic year required', 400);

  const exams = await Exam.find({ schoolId: req.schoolId, term, academicYear });
  if (exams.length === 0) return error(res, 'No exams found', 404);

  const studentFilter = { schoolId: req.schoolId, isActive: true };
  if (grade) studentFilter.grade = grade;
  if (section) studentFilter.section = section;
  const students = await Student.find(studentFilter).select('firstName lastName admissionNumber').sort({ firstName: 1 });

  const gradeDoc = grade ? await Grade.findOne({ schoolId: req.schoolId, name: grade }) : null;
  const subjects = gradeDoc ? await Subject.find({ schoolId: req.schoolId, gradeId: gradeDoc._id }).select('name code') : [];

  const examIds = exams.map(e => e._id);
  const allMarks = await Marks.find({ schoolId: req.schoolId, examId: { $in: examIds } });

  // Calculate per-student subject averages
  const result = students.map(student => {
    const studentMarks = allMarks.filter(m => m.studentId.toString() === student._id.toString());
    const subjectAverages = subjects.map(sub => {
      const subMarks = studentMarks.filter(m => m.subjectId.toString() === sub._id.toString());
      let weightedSum = 0, totalWeight = 0;
      subMarks.forEach(mk => {
        const exam = exams.find(e => e._id.toString() === mk.examId.toString());
        const weight = exam?.weight || (100 / exams.length);
        const pct = (mk.marksObtained / mk.totalMarks) * 100;
        weightedSum += pct * weight;
        totalWeight += weight;
      });
      const avgPct = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
      const { grade, remark } = getCBCGradeAndRemark(avgPct, 100);
      return {
        subjectId: sub._id,
        subjectName: sub.name,
        exams: subMarks.map(mk => {
          const exam = exams.find(e => e._id.toString() === mk.examId.toString());
          return {
            examName: exam?.name || 'Unknown',
            marks: mk.marksObtained,
            total: mk.totalMarks,
            pct: ((mk.marksObtained / mk.totalMarks) * 100).toFixed(1),
          };
        }),
        average: avgPct.toFixed(1),
        grade,
        remark,
      };
    });

    const overallAvg = subjectAverages.length > 0
      ? (subjectAverages.reduce((s, sa) => s + parseFloat(sa.average), 0) / subjectAverages.length).toFixed(1)
      : 0;
    const { grade: overallGrade } = getCBCGradeAndRemark(parseFloat(overallAvg), 100);

    return {
      studentId: student._id,
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      subjects: subjectAverages,
      overallAverage: overallAvg,
      overallGrade,
    };
  });

  // Class position (within section)
  const sortedByClass = [...result].sort((a, b) => parseFloat(b.overallAverage) - parseFloat(a.overallAverage));

  // Overall position (across all sections in the grade)
  let overallRankings = [];
  if (grade) {
    const allGradeStudents = await Student.find({ schoolId: req.schoolId, grade, isActive: true });
    if (allGradeStudents.length > 0) {
      const allGradeMarks = await Marks.find({
        schoolId: req.schoolId,
        examId: { $in: examIds },
        studentId: { $in: allGradeStudents.map(s => s._id) },
      });

      overallRankings = allGradeStudents.map(s => {
        const sMarks = allGradeMarks.filter(m => m.studentId.toString() === s._id.toString());
        let totalPct = 0;
        if (subjects.length > 0) {
          const subAvgs = subjects.map(sub => {
            const subMarks = sMarks.filter(m => m.subjectId.toString() === sub._id.toString());
            let ws = 0, tw = 0;
            subMarks.forEach(mk => {
              const ex = exams.find(e => e._id.toString() === mk.examId.toString());
              const w = ex?.weight || (100 / exams.length);
              ws += (mk.marksObtained / mk.totalMarks) * 100 * w;
              tw += w;
            });
            return tw > 0 ? ws / tw : 0;
          });
          totalPct = subAvgs.length > 0 ? subAvgs.reduce((a, b) => a + b, 0) / subAvgs.length : 0;
        }
        return { studentId: s._id.toString(), pct: totalPct };
      }).sort((a, b) => b.pct - a.pct);
    }
  }

  // Add positions
  const studentsWithPositions = result.map(s => ({
    ...s,
    classPosition: `${sortedByClass.findIndex(x => x.studentId.toString() === s.studentId.toString()) + 1}/${sortedByClass.length}`,
    overallPosition: overallRankings.length > 0
      ? `${overallRankings.findIndex(x => x.studentId === s.studentId.toString()) + 1}/${overallRankings.length}`
      : '—',
  }));

  return success(res, {
    term,
    academicYear,
    grade,
    section,
    exams: exams.map(e => ({ name: e.name, weight: e.weight })),
    students: studentsWithPositions,
  });
});

// ═══════════ REPORT CARDS ═══════════
const getReportCardData = asyncHandler(async (req, res) => {
  const { examId, grade, section } = req.query;
  if (!examId || !grade || !section) return error(res, 'Exam, grade and section required', 400);
  const exam = await Exam.findById(examId);
  const gradeDoc = await Grade.findOne({ schoolId: req.schoolId, name: grade });
  if (!gradeDoc) return error(res, 'Grade not found', 404);
  const students = await Student.find({ schoolId: req.schoolId, grade, section, isActive: true }).select('firstName lastName studentId admissionNumber').sort({ firstName: 1 });
  const subjects = await Subject.find({ schoolId: req.schoolId, gradeId: gradeDoc._id }).select('name code');
  const marks = await Marks.find({ schoolId: req.schoolId, examId, studentId: { $in: students.map(s => s._id) } });
  const existingReports = await ReportCard.find({ schoolId: req.schoolId, examId, grade, section });
  const reportMap = {}; existingReports.forEach(r => { reportMap[r.studentId.toString()] = r; });

  // Build student data
  const studentData = students.map(s => {
    const sm = marks.filter(m => m.studentId.toString() === s._id.toString());
    const subResults = subjects.map(sub => { const mk = sm.find(m => m.subjectId.toString() === sub._id.toString()); const { grade, remark } = mk ? getCBCGradeAndRemark(mk.marksObtained, mk.totalMarks) : { grade: null, remark: '' }; return { subjectId: sub._id, subjectName: sub.name, marks: mk?.marksObtained || null, total: mk?.totalMarks || 100, grade, remark, isSubmitted: !!mk }; });
    const tot = subResults.reduce((a, r) => a + (r.marks || 0), 0), tmax = subResults.reduce((a, r) => a + (r.marks !== null ? r.total : 0), 0), pct = tmax > 0 ? ((tot / tmax) * 100).toFixed(1) : 0;
    return { studentId: s._id, studentName: `${s.firstName} ${s.lastName}`, admissionNumber: s.admissionNumber, subjects: subResults, totalMarks: tot, totalMax: tmax, percentage: pct, overallGrade: calculateGrade(tot, tmax), reportCardId: reportMap[s._id.toString()]?._id || null, classTeacherRemark: reportMap[s._id.toString()]?.classTeacherRemark || '', principalRemark: reportMap[s._id.toString()]?.principalRemark || '', isPublished: reportMap[s._id.toString()]?.isPublished || false };
  });

  // Class position (within section)
  const sortedByClass = [...studentData].sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));

  // Overall position (within grade)
  const allGradeStudents = await Student.find({ schoolId: req.schoolId, grade, isActive: true });
  const allGradeMarks = await Marks.find({ schoolId: req.schoolId, examId, studentId: { $in: allGradeStudents.map(s => s._id) } });
  const gradeRankings = allGradeStudents.map(s => {
    const sMarks = allGradeMarks.filter(m => m.studentId.toString() === s._id.toString());
    const tot = sMarks.reduce((sum, m) => sum + m.marksObtained, 0);
    const tmax = sMarks.reduce((sum, m) => sum + m.totalMarks, 0);
    return { studentId: s._id.toString(), pct: tmax > 0 ? (tot / tmax) * 100 : 0 };
  }).sort((a, b) => b.pct - a.pct);

  const finalData = studentData.map(s => ({
    ...s,
    classPosition: `${sortedByClass.findIndex(x => x.studentId.toString() === s.studentId.toString()) + 1}/${sortedByClass.length}`,
    overallPosition: `${gradeRankings.findIndex(x => x.studentId === s.studentId.toString()) + 1}/${gradeRankings.length}`,
  }));

  return success(res, { exam, grade, section, subjects, students: finalData });
});

const generateReportCards = asyncHandler(async (req, res) => {
  if (!isAdminPrincipalDeputy(req.user.role)) return error(res, 'Access denied', 403);
  const { examId, grade, section, classTeacherRemark } = req.body;
  if (!examId || !grade || !section) return error(res, 'Exam, grade and section required', 400);
  const exam = await Exam.findById(examId);
  const gradeDoc = await Grade.findOne({ schoolId: req.schoolId, name: grade });
  const students = await Student.find({ schoolId: req.schoolId, grade, section, isActive: true });
  const subjects = await Subject.find({ schoolId: req.schoolId, gradeId: gradeDoc._id });
  const marks = await Marks.find({ schoolId: req.schoolId, examId, studentId: { $in: students.map(s => s._id) } });
  let created = 0;
  for (const s of students) {
    const sm = marks.filter(m => m.studentId.toString() === s._id.toString());
    const subResults = subjects.map(sub => { const mk = sm.find(m => m.subjectId.toString() === sub._id.toString()); const { grade, remark } = mk ? getCBCGradeAndRemark(mk.marksObtained, mk.totalMarks) : { grade: '', remark: '' }; return { subjectId: sub._id, marks: mk?.marksObtained || 0, total: mk?.totalMarks || 100, grade, remark }; });
    const tot = subResults.reduce((a, r) => a + r.marks, 0), tmax = subResults.reduce((a, r) => a + r.total, 0);
    await ReportCard.findOneAndUpdate({ schoolId: req.schoolId, examId, studentId: s._id }, { schoolId: req.schoolId, examId, studentId: s._id, grade, section, academicYear: exam.academicYear, subjects: subResults, totalMarks: tot, totalMax: tmax, percentage: tmax > 0 ? ((tot / tmax) * 100).toFixed(1) : 0, overallGrade: calculateGrade(tot, tmax), classTeacherRemark: classTeacherRemark || '', generatedBy: req.user.id }, { upsert: true, new: true });
    created++;
  }
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'report_cards_generated', details: `${created} students`, ip: req.ip });
  return success(res, { count: created }, `${created} report cards generated`);
});

const addPrincipalRemark = asyncHandler(async (req, res) => {
  if (!isAdminPrincipalDeputy(req.user.role)) return error(res, 'Access denied', 403);
  const { reportCardId, principalRemark } = req.body;
  const report = await ReportCard.findByIdAndUpdate(reportCardId, { principalRemark, reviewedBy: req.user.id }, { new: true });
  if (!report) return error(res, 'Report card not found', 404);
  return success(res, report, 'Remark added');
});

const publishReportCards = asyncHandler(async (req, res) => {
  if (!isAdminPrincipalDeputy(req.user.role)) return error(res, 'Access denied', 403);
  const { examId, grade, section } = req.body;
  await ReportCard.updateMany({ schoolId: req.schoolId, examId, grade, section }, { isPublished: true });
  return success(res, null, 'Report cards published');
});

const getPublishedReportCard = asyncHandler(async (req, res) => {
  const { studentId, examId } = req.query;
  const report = await ReportCard.findOne({ schoolId: req.schoolId, studentId, examId, isPublished: true }).populate('subjects.subjectId', 'name code').populate('studentId', 'firstName lastName admissionNumber grade section');
  if (!report) return error(res, 'Report card not found', 404);
  return success(res, report);
});

const generateTermAverageReportCards = asyncHandler(async (req, res) => {
  if (!isAdminPrincipalDeputy(req.user.role)) return error(res, 'Access denied', 403);
  const { term, academicYear, grade, section, classTeacherRemark, principalRemark } = req.body;
  if (!term || !academicYear || !grade || !section) return error(res, 'All fields required', 400);
  const exams = await Exam.find({ schoolId: req.schoolId, term, academicYear });
  if (exams.length === 0) return error(res, 'No exams found', 404);
  const students = await Student.find({ schoolId: req.schoolId, grade, section, isActive: true });
  const gradeDoc = await Grade.findOne({ schoolId: req.schoolId, name: grade });
  const subjects = await Subject.find({ schoolId: req.schoolId, gradeId: gradeDoc._id });
  const allMarks = await Marks.find({ schoolId: req.schoolId, examId: { $in: exams.map(e => e._id) } });
  let created = 0;
  for (const student of students) {
    const studentMarks = allMarks.filter(m => m.studentId.toString() === student._id.toString());
    const subjectResults = subjects.map(sub => {
      const subMarks = studentMarks.filter(m => m.subjectId.toString() === sub._id.toString());
      let weightedSum = 0, totalWeight = 0;
      subMarks.forEach(mk => { const exam = exams.find(e => e._id.toString() === mk.examId.toString()); const weight = exam?.weight || (100 / exams.length); const pct = (mk.marksObtained / mk.totalMarks) * 100; weightedSum += pct * weight; totalWeight += weight; });
      const avgPct = totalWeight > 0 ? (weightedSum / totalWeight) : 0;
      const { grade, remark } = getCBCGradeAndRemark(avgPct, 100);
      return { subjectId: sub._id, average: avgPct.toFixed(1), grade, remark };
    });
    const overallAvg = subjectResults.length > 0 ? (subjectResults.reduce((s, sa) => s + parseFloat(sa.average), 0) / subjectResults.length).toFixed(1) : 0;
    const { grade: overallGrade } = getCBCGradeAndRemark(parseFloat(overallAvg), 100);
    await ReportCard.findOneAndUpdate({ schoolId: req.schoolId, studentId: student._id, academicYear, term, type: 'average' }, { schoolId: req.schoolId, studentId: student._id, academicYear, term, grade, section, type: 'average', subjects: subjectResults, totalMarks: 0, totalMax: 0, percentage: parseFloat(overallAvg), overallGrade, classTeacherRemark: classTeacherRemark || '', principalRemark: principalRemark || '', generatedBy: req.user.id }, { upsert: true, new: true });
    created++;
  }
  return success(res, { count: created }, `${created} term average report cards generated`);
});

const getAverageReportCards = asyncHandler(async (req, res) => {
  const { term, academicYear, grade, section } = req.query;
  const reports = await ReportCard.find({ schoolId: req.schoolId, term, academicYear, grade, section, type: 'average' }).populate('studentId', 'firstName lastName admissionNumber').populate('subjects.subjectId', 'name');
  if (reports.length === 0) return error(res, 'No average report cards found', 404);
  return success(res, { term, academicYear, grade, section, students: reports.map(r => ({ studentId: r.studentId?._id, studentName: `${r.studentId?.firstName} ${r.studentId?.lastName}`, admissionNumber: r.studentId?.admissionNumber, subjects: r.subjects.map(s => ({ subjectId: s.subjectId?._id, subjectName: s.subjectId?.name, average: s.average, grade: s.grade, remark: s.remark })), overallAverage: r.percentage, overallGrade: r.overallGrade, classTeacherRemark: r.classTeacherRemark, principalRemark: r.principalRemark, reportCardId: r._id, isPublished: r.isPublished })) });
});

const publishAvgReportCards = asyncHandler(async (req, res) => {
  if (!isAdminPrincipalDeputy(req.user.role)) return error(res, 'Access denied', 403);
  const { term, academicYear, grade, section } = req.body;
  await ReportCard.updateMany({ schoolId: req.schoolId, term, academicYear, grade, section, type: 'average' }, { isPublished: true });
  return success(res, null, 'Average report cards published');
});

// ═══════════ RANKS ═══════════
const getRanks = asyncHandler(async (req, res) => {
  const { examId, grade, section, type } = req.query;
  if (!examId) return error(res, 'Exam ID required', 400);

  let exam, examName;
  if (examId.startsWith('avg-')) {
    const parts = examId.replace('avg-', '').split('-');
    const term = parts[0]; const academicYear = parts.slice(1).join('-');
    const exams = await Exam.find({ schoolId: req.schoolId, term, academicYear });
    if (exams.length === 0) return error(res, 'No exams found for this term', 404);
    examName = `${term.replace('term', 'Term ')} ${academicYear} Average`;
    exam = { name: examName, _id: null, term, academicYear, isAverage: true, exams };
  } else {
    const found = await Exam.findById(examId);
    if (!found) return error(res, 'Exam not found', 404);
    examName = found.name;
    exam = { name: examName, _id: found._id, isAverage: false };
  }

  const studentFilter = { schoolId: req.schoolId, isActive: true };
  if (grade) studentFilter.grade = grade;
  if (section) studentFilter.section = section;
  const students = await Student.find(studentFilter).select('firstName lastName admissionNumber grade section');
  const studentIds = students.map(s => s._id);
  const gradeDoc = grade ? await Grade.findOne({ schoolId: req.schoolId, name: grade }) : null;
  const subjects = gradeDoc ? await Subject.find({ schoolId: req.schoolId, gradeId: gradeDoc._id }).select('name code') : [];

  let allMarks;
  if (exam.isAverage) {
    allMarks = await Marks.find({ schoolId: req.schoolId, examId: { $in: exam.exams.map(e => e._id) }, studentId: { $in: studentIds } });
  } else {
    allMarks = await Marks.find({ schoolId: req.schoolId, examId: exam._id, studentId: { $in: studentIds } });
  }

  if (type === 'subject' && req.query.subjectId) {
    const subjectMarks = allMarks.filter(m => m.subjectId.toString() === req.query.subjectId);
    const ranked = students.map(s => {
      const sMarks = subjectMarks.filter(m => m.studentId.toString() === s._id.toString());
      let percentage, marksObtained = 0, totalMarks = 100;
      if (exam.isAverage) {
        let ws = 0, tw = 0;
        sMarks.forEach(mk => { const ex = exam.exams.find(e => e._id.toString() === mk.examId.toString()); const w = ex?.weight || (100 / exam.exams.length); ws += (mk.marksObtained / mk.totalMarks) * 100 * w; tw += w; });
        percentage = tw > 0 ? (ws / tw).toFixed(1) : '0'; marksObtained = parseFloat(percentage); totalMarks = 100;
      } else {
        const mark = sMarks[0]; marksObtained = mark?.marksObtained || 0; totalMarks = mark?.totalMarks || 100;
        percentage = mark ? ((mark.marksObtained / mark.totalMarks) * 100).toFixed(1) : '0';
      }
      const { grade: letterGrade } = getCBCGradeAndRemark(parseFloat(percentage), 100);
      return { studentId: s._id, studentName: `${s.firstName} ${s.lastName}`, admissionNumber: s.admissionNumber, grade: s.grade, section: s.section, marks: marksObtained, total: totalMarks, percentage, overallGrade: letterGrade };
    }).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage)).map((s, i) => ({ ...s, rank: i + 1 }));
    return success(res, { exam: { name: examName }, type: 'subject', subject: subjects.find(s => s._id.toString() === req.query.subjectId), students: ranked });
  }

  const ranked = students.map(s => {
    const sMarks = allMarks.filter(m => m.studentId.toString() === s._id.toString());
    let percentage, totalObtained = 0, totalMax = 0;
    if (exam.isAverage) {
      const subAvgs = subjects.map(sub => {
        const subMarks = sMarks.filter(m => m.subjectId.toString() === sub._id.toString());
        let ws = 0, tw = 0;
        subMarks.forEach(mk => { const ex = exam.exams.find(e => e._id.toString() === mk.examId.toString()); const w = ex?.weight || (100 / exam.exams.length); ws += (mk.marksObtained / mk.totalMarks) * 100 * w; tw += w; });
        return tw > 0 ? ws / tw : 0;
      });
      percentage = subAvgs.length > 0 ? (subAvgs.reduce((a, b) => a + b, 0) / subAvgs.length).toFixed(1) : '0';
      totalObtained = parseFloat(percentage); totalMax = 100;
    } else {
      totalObtained = sMarks.reduce((sum, m) => sum + m.marksObtained, 0);
      totalMax = sMarks.reduce((sum, m) => sum + m.totalMarks, 0);
      percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0';
    }
    const { grade: letterGrade } = getCBCGradeAndRemark(parseFloat(percentage), 100);
    return { studentId: s._id, studentName: `${s.firstName} ${s.lastName}`, admissionNumber: s.admissionNumber, grade: s.grade, section: s.section, totalMarks: totalObtained, totalMax, percentage, overallGrade: letterGrade };
  }).sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage)).map((s, i) => ({ ...s, rank: i + 1 }));

  return success(res, { exam: { name: examName }, type: 'overall', subjects, students: ranked });
});

module.exports = { getExams, createExam, updateExam, deleteExam, publishExam, getSubjectsForMarks, getStudentsForMarks, saveMarks, submitMarks, getTermAverage, getReportCardData, generateReportCards, addPrincipalRemark, publishReportCards, getPublishedReportCard, generateTermAverageReportCards, getAverageReportCards, publishAvgReportCards, getRanks };