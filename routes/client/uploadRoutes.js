const express = require('express');
const router = express.Router();
const auth = require('../../middleware/client/auth');
const tenant = require('../../middleware/client/tenant');
const multer = require('multer');
const upload = multer({ dest: 'uploads/temp/' });
const { upload: uploadController } = require('../../controllers/client/uploadController');

router.post('/upload', auth, tenant, upload.single('file'), uploadController);

module.exports = router;