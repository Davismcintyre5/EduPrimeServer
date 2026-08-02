const express = require('express');
const router = express.Router();
const { getLegals, createLegal, updateLegal, togglePublish, deleteLegal } = require('../../controllers/admin/legalController');
const adminAuth = require('../../middleware/admin/adminAuth');

router.use(adminAuth);

router.get('/', getLegals);
router.post('/', createLegal);
router.put('/:id', updateLegal);
router.patch('/:id/publish', togglePublish);
router.delete('/:id', deleteLegal);

module.exports = router;