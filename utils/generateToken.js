const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpire });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpire });
};

module.exports = { generateAccessToken, generateRefreshToken };