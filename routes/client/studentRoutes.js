const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getNextAdmissionNumber, getStudents, getStudent, createStudent, updateStudent, deleteStudent, toggleStudent } = require('../../controllers/client/studentController');

router.use(auth, tenant);

router.get('/next-adm', getNextAdmissionNumber);
router.get('/', getStudents);
router.get('/:id', getStudent);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.patch('/:id/toggle', toggleStudent);

module.exports = router;