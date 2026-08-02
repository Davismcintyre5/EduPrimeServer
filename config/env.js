const dotenv = require('dotenv');
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  appName: process.env.APP_NAME || 'EduPrime',
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',

  mongoUri: process.env.MONGO_URI,

  keepAlive: process.env.KEEP_ALIVE === 'true',

  redisEnabled: process.env.REDIS_ENABLED === 'true',
  redisUrl: process.env.REDIS_URL,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d',

  emailEnabled: process.env.EMAIL_ENABLED === 'true',
  hdmApiKey: process.env.HDM_API_KEY,
  hdmApiUrl: process.env.HDM_API_URL,
  hdmFromEmail: process.env.HDM_FROM_EMAIL,
  hdmFromName: process.env.HDM_FROM_NAME,

  smsEnabled: process.env.SMS_ENABLED === 'true',
  brevoApiKey: process.env.BREVO_API_KEY,
  brevoSender: process.env.BREVO_SENDER,

  cloudinaryEnabled: process.env.CLOUDINARY_ENABLED === 'true',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  socketEnabled: process.env.SOCKET_ENABLED === 'true',
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN,

  encryptionKey: process.env.ENCRYPTION_KEY,
};

module.exports = env;