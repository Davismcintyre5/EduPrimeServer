const { error } = require('../../utils/apiResponse');

const adminRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return error(res, 'Access denied. Insufficient permissions.', 403);
    }
    next();
  };
};

module.exports = adminRole;