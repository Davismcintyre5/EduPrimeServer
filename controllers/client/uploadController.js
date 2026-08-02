const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const { uploadFile } = require('../../services/uploadService');
const fs = require('fs');

const upload = asyncHandler(async (req, res) => {
  if (!req.file) return error(res, 'No file uploaded', 400);

  try {
    const filePath = req.file.path;
    const folder = req.body.folder || 'students';
    const url = await uploadFile(filePath, folder);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (!url) return error(res, 'Upload failed', 500);

    return success(res, { url }, 'File uploaded', 201);
  } catch (err) {
    return error(res, 'Upload failed', 500);
  }
});

module.exports = { upload };