const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { error } = require('../../utils/apiResponse');
const School = require('../../models/admin/School');

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return error(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;

    // Check if school is active
    if (decoded.schoolId) {
      const school = await School.findById(decoded.schoolId).select('isActive name');
      if (!school || !school.isActive) {
        return error(res, 'School is suspended. Contact administrator.', 403);
      }
    }

    next();
  } catch (err) {
    return error(res, 'Invalid or expired token.', 401);
  }
};

module.exports = auth;