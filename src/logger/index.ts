import winston from 'winston';
import { format } from 'winston';
const { combine, timestamp, printf, errors } = format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}  ${message}`;
});
const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: combine(timestamp(), myFormat),
  transports: [
    new winston.transports.Console({
      format: combine(
        errors({ stack: true }),
        format((info) => {
          info.level = info.level.toUpperCase();
          if (info.level == 'INFO') {
            info.level += ' ';
          }
          return info;
        })(),
        winston.format.colorize(),
        // winston.format.prettyPrint(),
        myFormat
      )
    })
  ]
});
export { logger };
