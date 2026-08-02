const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { error } = require('../../utils/apiResponse');

const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return error(res, 'Access denied. No token provided.', 401);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.admin = decoded;
    next();
  } catch (err) {
    return error(res, 'Invalid or expired token.', 401);
  }
};

module.exports = adminAuth;