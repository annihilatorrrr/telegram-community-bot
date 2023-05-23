import { utilities } from "nest-winston";
import winston from "winston";
import winstonDaily from 'winston-daily-rotate-file';

export const LOGGER_INFO = 'info';
export const LOGGER_ERROR = 'error';
export const LOGGER_BOTCHECK = 'botCheck';
export const LOGGER_EXCEPTION = 'exception';

const dailyOption = (level: string) => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    filename: `logs/service/${level}/%DATE%.${level}.log`,
    maxFiles: 7,
    zippedArchive: true,
    format: winston.format.combine(
      winston.format.timestamp(),
      utilities.format.nestLike(),
    )
  }
}

export const winstonOptions = {
  levels: {error: 0, warn: 1, info: 2, debug: 3, exception: 4, botCheck: 5 },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winstonDaily(dailyOption(LOGGER_INFO)),
    new winstonDaily(dailyOption(LOGGER_ERROR)),
    new winstonDaily(dailyOption(LOGGER_BOTCHECK)),
  ],
  exceptionHandlers: [
    new winstonDaily(dailyOption(LOGGER_EXCEPTION))
  ]
};