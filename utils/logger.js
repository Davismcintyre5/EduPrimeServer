const winston = require('winston');
const env = require('../config/env');

const colorize = winston.format.colorize();

const customFormat = winston.format.printf(({ timestamp, level, message, statusCode, method, url }) => {
  let coloredStatus = '';
  
  if (statusCode) {
    const code = Number(statusCode);
    if (code >= 200 && code < 300) coloredStatus = `\x1b[42m\x1b[30m ${code} \x1b[0m`;      // Green bg
    else if (code >= 300 && code < 400) coloredStatus = `\x1b[46m\x1b[30m ${code} \x1b[0m`; // Cyan bg
    else if (code >= 400 && code < 500) coloredStatus = `\x1b[43m\x1b[30m ${code} \x1b[0m`; // Yellow bg
    else if (code >= 500) coloredStatus = `\x1b[41m\x1b[37m ${code} \x1b[0m`;               // Red bg
  }

  const methodColors = {
    GET: '\x1b[32m',
    POST: '\x1b[34m',
    PUT: '\x1b[33m',
    PATCH: '\x1b[35m',
    DELETE: '\x1b[31m',
  };

  const coloredMethod = method ? `${methodColors[method] || ''}${method}\x1b[0m` : '';
  const methodAndUrl = coloredMethod && url ? `${coloredMethod} ${url}` : message;

  return `${timestamp} [${level.toUpperCase()}]: ${coloredStatus ? coloredStatus + ' ' : ''}${methodAndUrl}`;
});

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  customFormat
);

const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
);

const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({
      format: env.nodeEnv === 'production' ? prodFormat : devFormat,
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;