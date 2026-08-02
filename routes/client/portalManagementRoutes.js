const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getParents, toggleParent } = require('../../controllers/client/portalManagementController');

router.use(auth, tenant);
router.get('/parents', getParents);
router.patch('/parents/:id/toggle', toggleParent);

module.exports = router;