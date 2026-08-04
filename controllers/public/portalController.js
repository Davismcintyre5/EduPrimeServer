const Parent = require('../../models/client/Parent');
const Student = require('../../models/client/Student');
const School = require('../../models/admin/School');
const Attendance = require('../../models/client/Attendance');
const ReportCard = require('../../models/client/ReportCard');
const FeeTransaction = require('../../models/client/FeeTransaction');
const FeeStructure = require('../../models/client/FeeStructure');
const Announcement = require('../../models/client/Announcement');
const Timetable = require('../../models/client/Timetable');
const Grade = require('../../models/client/Grade');
const Section = require('../../models/client/Section');
const Exam = require('../../models/client/Exam');
const Marks = require('../../models/client/Marks');
const Subject = require('../../models/client/Subject');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { hashPassword, comparePassword } = require('../../utils/hashPassword');
const { generateAccessToken, generateRefreshToken } = require('../../utils/generateToken');
const { sendEmail } = require('../../services/emailService');
const crypto = require('crypto');
const logger = require('../../utils/logger');

// ═══════════ REGISTER ═══════════
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, schoolCode, admissionNumber } = req.body;
  if (!name || !email || !password || !schoolCode || !admissionNumber) {
    return error(res, 'All fields are required', 400);
  }

  // Find school by code
  const school = await School.findOne({ code: schoolCode, isActive: true });
  if (!school) return error(res, 'Invalid school code. Please check and try again.', 404);

  // Find student within that school
  const student = await Student.findOne({ admissionNumber, schoolId: school._id });
  if (!student) return error(res, 'Student not found in this school. Please check the admission number and school code.', 404);

  // Check if parent already exists
  let parent = await Parent.findOne({ email });
  if (parent) {
    if (!parent.children.includes(student._id)) { parent.children.push(student._id); await parent.save(); }
    if (!student.parentId || student.parentId.toString() !== parent._id.toString()) { student.parentId = parent._id; await student.save(); }
    return success(res, { message: 'This student has been linked to your existing account. Please login.' }, 'Student linked successfully');
  }

  try {
    const hashed = await hashPassword(password);
    parent = await Parent.create({ schoolId: school._id, name, email, phone: phone || '', password: hashed, children: [student._id], isActive: true });
    student.parentId = parent._id; await student.save();

    try {
      await sendEmail(email, 'welcomeParent', {
        schoolName: school.name, logo: school.logo, parentName: name,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber, grade: student.grade, section: student.section,
        portalUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/portal/login`, school,
      }, school);
    } catch (emailErr) { logger.warn(`⚠️ Failed to send welcome email: ${emailErr.message}`); }

    return success(res, { parentId: parent._id, message: 'Registration successful! You can now login.' }, 'Registration successful', 201);
  } catch (err) {
    logger.error(`❌ Parent creation error: ${err.message}`);
    if (err.name === 'ValidationError') { const messages = Object.values(err.errors).map(e => e.message).join(', '); return error(res, 'Validation error: ' + messages, 400); }
    if (err.code === 11000) return error(res, 'An account with this email already exists', 400);
    return error(res, 'Registration failed. Please try again.', 500);
  }
});

// ═══════════ LOGIN ═══════════
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return error(res, 'Email and password required', 400);
  const parent = await Parent.findOne({ email, isActive: true });
  if (!parent) return error(res, 'Invalid credentials', 401);
  const isMatch = await comparePassword(password, parent.password);
  if (!isMatch) return error(res, 'Invalid credentials', 401);
  const token = generateAccessToken({ id: parent._id, role: 'parent' });
  const refreshToken = generateRefreshToken({ id: parent._id });
  return success(res, { token, refreshToken, parent: { id: parent._id, name: parent.name, email: parent.email, phone: parent.phone } }, 'Login successful');
});

// ═══════════ FORGOT PASSWORD ═══════════
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const parent = await Parent.findOne({ email, isActive: true });
  if (!parent) return success(res, null, 'If account exists, reset link sent');
  const resetToken = crypto.randomBytes(32).toString('hex');
  parent.resetToken = resetToken; parent.resetTokenExpiry = Date.now() + 3600000; await parent.save();
  const child = await Student.findById(parent.children[0]);
  const school = child ? await School.findById(child.schoolId) : null;
  await sendEmail(email, 'parentPasswordReset', { resetUrl: `${process.env.CLIENT_URL}/portal/reset-password?token=${resetToken}`, schoolName: school?.name, logo: school?.logo, school }, school);
  return success(res, null, 'If account exists, reset link sent');
});

// ═══════════ RESET PASSWORD ═══════════
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const parent = await Parent.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  if (!parent) return error(res, 'Invalid or expired reset link', 400);
  parent.password = await hashPassword(password);
  parent.resetToken = undefined; parent.resetTokenExpiry = undefined; await parent.save();
  return success(res, null, 'Password reset successful');
});

// ═══════════ CHANGE PASSWORD ═══════════
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const parent = await Parent.findById(req.user.id);
  const isMatch = await comparePassword(currentPassword, parent.password);
  if (!isMatch) return error(res, 'Current password is incorrect', 400);
  parent.password = await hashPassword(newPassword); await parent.save();
  return success(res, null, 'Password changed');
});

// ═══════════ DASHBOARD ═══════════
const getDashboard = asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.user.id).populate('children');
  if (!parent) return error(res, 'Parent not found', 404);
  const childrenData = await Promise.all(parent.children.map(async (student) => {
    if (!student.isActive) return null;
    const school = await School.findById(student.schoolId).select('name logo currency');
    const totalAttendance = await Attendance.countDocuments({ studentId: student._id });
    const presentAttendance = await Attendance.countDocuments({ studentId: student._id, status: 'present' });
    const fees = await FeeTransaction.find({ studentId: student._id });
    const latestReport = await ReportCard.findOne({ studentId: student._id, isPublished: true }).sort({ createdAt: -1 });
    return {
      _id: student._id, firstName: student.firstName, lastName: student.lastName,
      admissionNumber: student.admissionNumber, grade: student.grade, section: student.section, photo: student.photo,
      school: school ? { name: school.name, logo: school.logo, currency: school.currency } : null,
      attendance: { total: totalAttendance, present: presentAttendance, percentage: totalAttendance > 0 ? ((presentAttendance / totalAttendance) * 100).toFixed(1) : 100 },
      fees: { total: fees.reduce((s, f) => s + f.amount, 0), paid: fees.reduce((s, f) => s + f.paidAmount, 0) },
      latestReport: latestReport ? { name: latestReport.examId ? 'Exam' : 'Average', percentage: latestReport.percentage, grade: latestReport.overallGrade } : null,
    };
  }));
  return success(res, childrenData.filter(Boolean));
});

// ═══════════ STUDENT DETAIL ═══════════
const getStudentDetail = asyncHandler(async (req, res) => {
  const parent = await Parent.findById(req.user.id);
  const student = await Student.findOne({ _id: req.params.studentId, parentId: parent._id });
  if (!student) return error(res, 'Student not found', 404);

  const school = await School.findById(student.schoolId).select('name logo currency address town');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const attendanceRecords = await Attendance.find({ studentId: student._id }).sort({ date: -1 }).limit(30);
  const totalAtt = await Attendance.countDocuments({ studentId: student._id });
  const presentAtt = await Attendance.countDocuments({ studentId: student._id, status: 'present' });
  const todayAtt = await Attendance.findOne({ studentId: student._id, date: { $gte: today } });
  const fees = await FeeTransaction.find({ studentId: student._id }).sort({ createdAt: -1 });
  const feeStructures = await FeeStructure.find({ schoolId: student.schoolId }).select('name feeType amount term academicYear');
  const gradeDoc = await Grade.findOne({ schoolId: student.schoolId, name: student.grade });
  const subjects = gradeDoc ? await Subject.find({ schoolId: student.schoolId, gradeId: gradeDoc._id }).select('_id name') : [];
  const sectionDoc = gradeDoc ? await Section.findOne({ gradeId: gradeDoc._id, name: student.section }) : null;
  const timetable = sectionDoc ? await Timetable.find({ schoolId: student.schoolId, gradeId: gradeDoc._id, sectionId: sectionDoc._id }).populate('periods.subjectId', 'name') : [];
  const announcements = await Announcement.find({ schoolId: student.schoolId }).sort({ createdAt: -1 }).limit(5);

  const reportCards = await ReportCard.find({ studentId: student._id, isPublished: true })
    .sort({ createdAt: -1 }).populate('examId', 'name type').populate('subjects.subjectId', 'name code');

  const enrichedReportCards = await Promise.all(reportCards.map(async (report) => {
    const robj = report.toObject();

    if (report.type === 'average' && report.term && report.academicYear) {
      const exams = await Exam.find({ schoolId: student.schoolId, term: report.term, academicYear: report.academicYear }).select('name weight');
      const examIds = exams.map(e => e._id);
      const allMarks = await Marks.find({ schoolId: student.schoolId, studentId: student._id, examId: { $in: examIds } });

      robj.subjects = robj.subjects.map(sub => {
        const subId = sub.subjectId?._id || sub.subjectId;
        const subMarks = allMarks.filter(m => m.subjectId.toString() === subId.toString());
        const examScores = exams.map(exam => {
          const mark = subMarks.find(m => m.examId.toString() === exam._id.toString());
          return { examName: exam.name, marks: mark?.marksObtained, total: mark?.totalMarks, pct: mark ? ((mark.marksObtained / mark.totalMarks) * 100).toFixed(1) : null };
        });
        return { ...sub, exams: examScores };
      });
      robj.exams = exams.map(e => ({ name: e.name, weight: e.weight }));

      // Class position
      if (student.section) {
        const sectionStudents = await Student.find({ schoolId: student.schoolId, grade: student.grade, section: student.section, isActive: true });
        if (sectionStudents.length > 0) {
          const sectionMarks = await Marks.find({ schoolId: student.schoolId, examId: { $in: examIds }, studentId: { $in: sectionStudents.map(s => s._id) } });
          const rankings = sectionStudents.map(s => {
            const sMarks = sectionMarks.filter(m => m.studentId.toString() === s._id.toString());
            let totalPct = 0;
            if (sMarks.length > 0 && subjects.length > 0) {
              const subjectPcts = subjects.map(sub => {
                const subMarks = sMarks.filter(m => m.subjectId.toString() === sub._id.toString());
                let ws = 0, tw = 0;
                subMarks.forEach(mk => { const ex = exams.find(e => e._id.toString() === mk.examId.toString()); const w = ex?.weight || (100 / exams.length); ws += (mk.marksObtained / mk.totalMarks) * 100 * w; tw += w; });
                return tw > 0 ? ws / tw : 0;
              });
              totalPct = subjectPcts.length > 0 ? subjectPcts.reduce((a, b) => a + b, 0) / subjectPcts.length : 0;
            }
            return { studentId: s._id.toString(), pct: totalPct };
          }).sort((a, b) => b.pct - a.pct);
          const pos = rankings.findIndex(x => x.studentId === student._id.toString()) + 1;
          robj.classPosition = `${pos}/${rankings.length}`;
        }
      }

      // Overall position
      const allGradeStudents = await Student.find({ schoolId: student.schoolId, grade: student.grade, isActive: true });
      if (allGradeStudents.length > 0) {
        const allGradeMarks = await Marks.find({ schoolId: student.schoolId, examId: { $in: examIds }, studentId: { $in: allGradeStudents.map(s => s._id) } });
        const gradeRankings = allGradeStudents.map(s => {
          const sMarks = allGradeMarks.filter(m => m.studentId.toString() === s._id.toString());
          let totalPct = 0;
          if (sMarks.length > 0 && subjects.length > 0) {
            const subjectPcts = subjects.map(sub => {
              const subMarks = sMarks.filter(m => m.subjectId.toString() === sub._id.toString());
              let ws = 0, tw = 0;
              subMarks.forEach(mk => { const ex = exams.find(e => e._id.toString() === mk.examId.toString()); const w = ex?.weight || (100 / exams.length); ws += (mk.marksObtained / mk.totalMarks) * 100 * w; tw += w; });
              return tw > 0 ? ws / tw : 0;
            });
            totalPct = subjectPcts.length > 0 ? subjectPcts.reduce((a, b) => a + b, 0) / subjectPcts.length : 0;
          }
          return { studentId: s._id.toString(), pct: totalPct };
        }).sort((a, b) => b.pct - a.pct);
        const pos = gradeRankings.findIndex(x => x.studentId === student._id.toString()) + 1;
        robj.overallPosition = `${pos}/${gradeRankings.length}`;
      }
    }

    // Single exam positions
    if (report.examId && report.type !== 'average') {
      if (student.section) {
        const sectionStudents = await Student.find({ schoolId: student.schoolId, grade: student.grade, section: student.section, isActive: true });
        if (sectionStudents.length > 0) {
          const sectionMarks = await Marks.find({ schoolId: student.schoolId, examId: report.examId, studentId: { $in: sectionStudents.map(s => s._id) } });
          const rankings = sectionStudents.map(s => {
            const sMarks = sectionMarks.filter(m => m.studentId.toString() === s._id.toString());
            const tot = sMarks.reduce((sum, m) => sum + m.marksObtained, 0);
            const tmax = sMarks.reduce((sum, m) => sum + m.totalMarks, 0);
            return { studentId: s._id.toString(), pct: tmax > 0 ? (tot / tmax) * 100 : 0 };
          }).sort((a, b) => b.pct - a.pct);
          const pos = rankings.findIndex(x => x.studentId === student._id.toString()) + 1;
          robj.classPosition = `${pos}/${rankings.length}`;
        }
      }
      const allGradeStudents = await Student.find({ schoolId: student.schoolId, grade: student.grade, isActive: true });
      if (allGradeStudents.length > 0) {
        const allGradeMarks = await Marks.find({ schoolId: student.schoolId, examId: report.examId, studentId: { $in: allGradeStudents.map(s => s._id) } });
        const gradeRankings = allGradeStudents.map(s => {
          const sMarks = allGradeMarks.filter(m => m.studentId.toString() === s._id.toString());
          const tot = sMarks.reduce((sum, m) => sum + m.marksObtained, 0);
          const tmax = sMarks.reduce((sum, m) => sum + m.totalMarks, 0);
          return { studentId: s._id.toString(), pct: tmax > 0 ? (tot / tmax) * 100 : 0 };
        }).sort((a, b) => b.pct - a.pct);
        const pos = gradeRankings.findIndex(x => x.studentId === student._id.toString()) + 1;
        robj.overallPosition = `${pos}/${gradeRankings.length}`;
      }
    }

    return robj;
  }));

  return success(res, {
    student: { ...student.toObject(), school: school?.name, schoolLogo: school?.logo, currency: school?.currency, address: school?.address, town: school?.town },
    attendance: { records: attendanceRecords, total: totalAtt, present: presentAtt, percentage: totalAtt > 0 ? ((presentAtt / totalAtt) * 100).toFixed(1) : 100, today: todayAtt?.status || 'not marked' },
    fees: { transactions: fees, total: fees.reduce((s, f) => s + f.amount, 0), paid: fees.reduce((s, f) => s + f.paidAmount, 0), structures: feeStructures },
    reportCards: enrichedReportCards,
    timetable,
    announcements,
  });
});

module.exports = { register, login, forgotPassword, resetPassword, changePassword, getDashboard, getStudentDetail };