const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getSalaryStructures, getSalaryStructure, createSalaryStructure,getCasualStaff,
    createCasualStaff,updateCasualStaff,deleteCasualStaff,toggleCasualStaff,
     updateSalaryStructure, deleteSalaryStructure, getPayrolls, generatePayroll, 
     updatePayrollStatus, deletePayroll, getPayrollStats } = require('../../controllers/client/hrController');

router.use(auth, tenant);

// Salary Structures
router.get('/structures', getSalaryStructures);
router.get('/structures/:id', getSalaryStructure);
router.post('/structures', createSalaryStructure);
router.put('/structures/:id', updateSalaryStructure);
router.delete('/structures/:id', deleteSalaryStructure);

// Payroll
router.get('/payrolls', getPayrolls);
router.post('/generate-payroll', generatePayroll);
router.patch('/payrolls/:id/status', updatePayrollStatus);
router.delete('/payrolls/:id', deletePayroll);
router.get('/payroll-stats', getPayrollStats);
router.patch('/casual/:id/toggle', toggleCasualStaff);


router.get('/casual', getCasualStaff);
router.post('/casual', createCasualStaff);
router.put('/casual/:id', updateCasualStaff);
router.delete('/casual/:id', deleteCasualStaff);

module.exports = router;