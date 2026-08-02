const cors = require('cors');
const env = require('../../config/env');

const corsOptions = {
  origin: [env.clientUrl, env.adminUrl],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-school-id'],
};

module.exports = cors(corsOptions);