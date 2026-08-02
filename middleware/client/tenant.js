const { error } = require('../../utils/apiResponse');

const tenant = (req, res, next) => {
  const schoolId = req.headers['x-school-id'] || req.user?.schoolId;

  if (!schoolId) {
    return error(res, 'School ID is required.', 400);
  }

  req.schoolId = schoolId;
  next();
};

module.exports = tenant;