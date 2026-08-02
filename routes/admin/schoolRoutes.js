const express = require('express');
const router = express.Router();
const { 
  createSchool, getSchools, getSchool, updateSchool, 
  suspendSchool, reactivateSchool, deleteSchool,
  getCountries, getCounties, getConstituencies, getWards
} = require('../../controllers/admin/schoolController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

// Reference data
router.get('/reference/countries', getCountries);
router.get('/reference/counties', getCounties);
router.get('/reference/constituencies', getConstituencies);
router.get('/reference/wards', getWards);

// CRUD
router.post('/', createSchool);
router.get('/', getSchools);
router.get('/:id', getSchool);
router.put('/:id', updateSchool);
router.patch('/:id/suspend', suspendSchool);
router.patch('/:id/reactivate', reactivateSchool);
router.delete('/:id', deleteSchool);

module.exports = router;