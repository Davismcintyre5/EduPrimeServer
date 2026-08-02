const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/settings', require('./settingRoutes'));
router.use('/', require('./profileRoutes'));
router.use('/', require('./userRoutes'));
router.use('/', require('./backupRoutes'));
router.use('/', require('./logRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/students', require('./studentRoutes'));
router.use('/academic', require('./academicRoutes'));
router.use('/finance', require('./financeRoutes'));  
router.use('/attendance', require('./attendanceRoutes')); 
router.use('/', require('./uploadRoutes'));
router.use('/exams', require('./examRoutes'));
router.use('/portal', require('./portalManagementRoutes'));
router.use('/library', require('./libraryRoutes'));
router.use('/inventory', require('./inventoryRoutes'));
router.use('/homework', require('./homeworkRoutes'));
router.use('/leave', require('./leaveRoutes'));
router.use('/communications', require('./communicationRoutes'));
router.use('/hr', require('./hrRoutes'));

module.exports = router;