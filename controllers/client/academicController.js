const Grade = require('../../models/client/Grade');
const Section = require('../../models/client/Section');
const Subject = require('../../models/client/Subject');
const Timetable = require('../../models/client/Timetable');
const AuditLog = require('../../models/client/Log');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

// ═══════════ GRADES ═══════════

const getGrades = asyncHandler(async (req, res) => {
  const grades = await Grade.find({ schoolId: req.schoolId }).sort({ name: 1 });
  return success(res, grades);
});

const createGrade = asyncHandler(async (req, res) => {
  const { name, level, hasStreams, streams } = req.body;
  if (!name || !level) return error(res, 'Name and level are required', 400);
  const exists = await Grade.findOne({ schoolId: req.schoolId, name });
  if (exists) return error(res, 'Grade already exists', 400);
  const grade = await Grade.create({ schoolId: req.schoolId, name, level, hasStreams: hasStreams || false, streams: streams || [] });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'grade_created', details: name, ip: req.ip });
  return success(res, grade, 'Grade created', 201);
});

const updateGrade = asyncHandler(async (req, res) => {
  const allowed = ['name', 'level', 'hasStreams', 'streams'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const grade = await Grade.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, updates, { new: true });
  if (!grade) return error(res, 'Grade not found', 404);
  return success(res, grade, 'Grade updated');
});

const deleteGrade = asyncHandler(async (req, res) => {
  const grade = await Grade.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  if (!grade) return error(res, 'Grade not found', 404);
  await Section.deleteMany({ gradeId: grade._id });
  await Subject.deleteMany({ gradeId: grade._id });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'grade_deleted', details: grade.name, ip: req.ip });
  return success(res, null, 'Grade deleted');
});

// ═══════════ SECTIONS ═══════════

const getSections = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.schoolId };
  if (req.query.gradeId) filter.gradeId = req.query.gradeId;
  const sections = await Section.find(filter).populate('classTeacher', 'name');
  return success(res, sections);
});

const createSection = asyncHandler(async (req, res) => {
  const { name, gradeId, classTeacher, capacity } = req.body;
  if (!name || !gradeId) return error(res, 'Name and grade are required', 400);

  const sectionData = {
    schoolId: req.schoolId,
    name,
    gradeId,
    capacity: capacity || 40,
  };

  // Only set classTeacher if it's a valid value
  if (classTeacher && classTeacher !== '') {
    sectionData.classTeacher = classTeacher;
  }

  const section = await Section.create(sectionData);
  await Grade.findByIdAndUpdate(gradeId, { $addToSet: { sections: name } });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'section_created', details: name, ip: req.ip });
  return success(res, section, 'Section created', 201);
});

const updateSection = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Remove empty classTeacher
  if (updates.classTeacher === '') {
    delete updates.classTeacher;
  }

  const section = await Section.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.schoolId },
    updates,
    { new: true }
  );
  if (!section) return error(res, 'Section not found', 404);
  return success(res, section, 'Section updated');
});

const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  if (!section) return error(res, 'Section not found', 404);
  await Grade.findByIdAndUpdate(section.gradeId, { $pull: { sections: section.name } });
  return success(res, null, 'Section deleted');
});

// ═══════════ SUBJECTS ═══════════

const getSubjects = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.schoolId };
  if (req.query.gradeId) filter.gradeId = req.query.gradeId;
  const subjects = await Subject.find(filter).populate('teacherId', 'name');
  return success(res, subjects);
});

const createSubject = asyncHandler(async (req, res) => {
  const { name, code, gradeId, teacherId, isCompulsory } = req.body;
  if (!name || !gradeId) return error(res, 'Name and grade are required', 400);

  const subjectData = {
    schoolId: req.schoolId,
    name,
    code: code || '',
    gradeId,
    isCompulsory: isCompulsory !== undefined ? isCompulsory : true,
  };

  // Only set teacherId if valid
  if (teacherId && teacherId !== '') {
    subjectData.teacherId = teacherId;
  }

  const subject = await Subject.create(subjectData);
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'subject_created', details: name, ip: req.ip });
  return success(res, subject, 'Subject created', 201);
});

const updateSubject = asyncHandler(async (req, res) => {
  const updates = { ...req.body };

  // Remove empty teacherId
  if (updates.teacherId === '') {
    delete updates.teacherId;
  }

  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.schoolId },
    updates,
    { new: true }
  );
  if (!subject) return error(res, 'Subject not found', 404);
  return success(res, subject, 'Subject updated');
});

const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  if (!subject) return error(res, 'Subject not found', 404);
  return success(res, null, 'Subject deleted');
});

// ═══════════ TIMETABLE ═══════════

// GET — Return properly populated data
const getTimetable = asyncHandler(async (req, res) => {
  const filter = { schoolId: req.schoolId };
  if (req.query.gradeId) filter.gradeId = req.query.gradeId;
  if (req.query.sectionId) filter.sectionId = req.query.sectionId;

  const timetable = await Timetable.find(filter)
    .populate('periods.subjectId', 'name code')
    .populate('periods.teacherId', 'name')
    .lean();

  return success(res, timetable);
});

// POST — Clean empty fields and validate
const saveTimetable = asyncHandler(async (req, res) => {
  const { gradeId, sectionId, day, periods } = req.body;
  if (!gradeId || !sectionId || !day) return error(res, 'Grade, section and day required', 400);

  // Clean periods — remove empty strings
  const cleanedPeriods = (periods || []).map(p => {
    const cleaned = {
      subjectId: p.subjectId || null,
      startTime: p.startTime || '',
      endTime: p.endTime || '',
    };
    if (p.teacherId && p.teacherId !== '' && p.teacherId !== null) {
      cleaned.teacherId = p.teacherId;
    }
    return cleaned;
  }).filter(p => p.subjectId); // Only save periods with a subject

  let entry = await Timetable.findOne({ schoolId: req.schoolId, gradeId, sectionId, day });
  if (entry) {
    entry.periods = cleanedPeriods;
    await entry.save();
  } else {
    entry = await Timetable.create({ schoolId: req.schoolId, gradeId, sectionId, day, periods: cleanedPeriods });
  }

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'timetable_updated', details: `${day}`, ip: req.ip });
  return success(res, entry, 'Timetable saved');
});

const deleteTimetable = asyncHandler(async (req, res) => {
  await Timetable.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Timetable deleted');
});

const deleteTimetableByGrade = asyncHandler(async (req, res) => {
  const { gradeId } = req.params;
  await Timetable.deleteMany({ schoolId: req.schoolId, gradeId });
  return success(res, null, 'Timetable deleted');
});

module.exports = {
  getGrades, createGrade, updateGrade, deleteGrade,
  getSections, createSection, updateSection, deleteSection,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getTimetable, saveTimetable,deleteTimetable,deleteTimetableByGrade,
};