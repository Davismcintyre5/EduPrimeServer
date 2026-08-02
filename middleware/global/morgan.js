const morgan = require('morgan');
const logger = require('../../utils/logger');
const env = require('../../config/env');

const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

const skip = () => env.nodeEnv === 'production';

const morganMiddleware = morgan(':method :url :status :response-time ms', { stream, skip });

module.exports = morganMiddleware;