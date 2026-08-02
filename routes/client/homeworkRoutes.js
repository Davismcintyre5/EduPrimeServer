const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getHomework, createHomework, getHomeworkById, deleteHomework, getSubmissions, submitHomework, gradeSubmission } = require('../../controllers/client/homeworkController');

router.use(auth, tenant);
router.get('/', getHomework);
router.post('/', createHomework);
router.get('/:id', getHomeworkById);
router.delete('/:id', deleteHomework);
router.get('/submissions/:homeworkId', getSubmissions);
router.post('/submit/:homeworkId', submitHomework);
router.patch('/grade/:submissionId', gradeSubmission);

module.exports = router;