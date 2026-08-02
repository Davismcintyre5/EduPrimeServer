const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const {
  getExams, createExam, updateExam, deleteExam, publishExam,
  getSubjectsForMarks, getStudentsForMarks, saveMarks, submitMarks,
  getReportCardData, generateReportCards, addPrincipalRemark, publishReportCards, getPublishedReportCard,
  getTermAverage, generateTermAverageReportCards, getAverageReportCards, publishAvgReportCards,
  getRanks,
} = require('../../controllers/client/examController');

router.use(auth, tenant);

// Exams list
router.get('/', getExams);
router.post('/', createExam);

// Specific routes BEFORE /:id
router.put('/principal-remark', addPrincipalRemark);
router.post('/generate-report-cards', generateReportCards);
router.post('/publish-report-cards', publishReportCards);
router.get('/report-data', getReportCardData);
router.get('/published-report', getPublishedReportCard);
router.get('/subjects', getSubjectsForMarks);
router.get('/students-marks', getStudentsForMarks);
router.post('/marks', saveMarks);
router.post('/marks/submit', submitMarks);
router.get('/term-average', getTermAverage);
router.post('/generate-avg-report-cards', generateTermAverageReportCards);
router.get('/avg-report-cards', getAverageReportCards);
router.post('/publish-avg-report-cards', publishAvgReportCards);
router.get('/ranks', getRanks);

// ID routes LAST
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);
router.patch('/:id/publish', publishExam);

module.exports = router;