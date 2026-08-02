const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const { getCommunications, createCommunication, updateCommunication, deleteCommunication } = require('../../controllers/client/communicationController');

router.use(auth, tenant);
router.get('/', getCommunications);
router.post('/', createCommunication);
router.put('/:id', updateCommunication);
router.delete('/:id', deleteCommunication);

module.exports = router;