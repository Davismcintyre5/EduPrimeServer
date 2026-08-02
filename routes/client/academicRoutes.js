const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const {
  getGrades, createGrade, updateGrade, deleteGrade,
  getSections, createSection, updateSection, deleteSection,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getTimetable, saveTimetable,
} = require('../../controllers/client/academicController');

router.use(auth, tenant);

// Grades
router.get('/grades', getGrades);
router.post('/grades', createGrade);
router.put('/grades/:id', updateGrade);
router.delete('/grades/:id', deleteGrade);

// Sections
router.get('/sections', getSections);
router.post('/sections', createSection);
router.put('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);

// Subjects
router.get('/subjects', getSubjects);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

// Timetable
router.get('/timetable', getTimetable);
router.post('/timetable', saveTimetable);

module.exports = router;