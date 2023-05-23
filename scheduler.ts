import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import * as winston from 'winston';
import { utilities } from "nest-winston";
import 'winston-daily-rotate-file';

dotenv.config({ path: '.env.production' });

interface MessageInfo {
  chatId: number;
  messageId: number;
  expireAt?: number;
}

const createLogger = (level: string) => {
  const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
    level: level,
    filename: `logs/scheduler/${level}/%DATE%.${level}.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: 7,
    format: winston.format.combine(
      winston.format.timestamp(),
      utilities.format.nestLike(),
    ),
  });

  const logger = winston.createLogger({
    level: level,
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      dailyRotateFileTransport
    ]
  });

  return logger;
}

const infoLogger = createLogger('info');
const errorLogger = createLogger('error');
const exceptionLogger = createLogger('exception');

const startScheduler = async () => {
  infoLogger.log("info", `🟢 Scheduler Timer : ${new Date()} (${Date.now()})`);
  
  const TOKEN: string | undefined = process.env.TOKEN;

  if (TOKEN) {
    const bot = new Telegraf(TOKEN);
    
    // Restrict
    const restrictFilePath: string | undefined = process.env.RESTRICT_FILE_PATH;
    if (restrictFilePath) {
      if (existsSync(restrictFilePath)) {
        const messages: MessageInfo[] = JSON.parse(readFileSync(restrictFilePath, 'utf8'));
        
        const notDeleteMessages: MessageInfo[] = [];
        const deleteMessages: MessageInfo[] = [];

        for (const message of messages) {
          if (Date.now() - message.expireAt! <= (3 * 60 * 1000)) {
          // if ((message.expireAt! + (3 * 60 * 1000)) <= Date.now()) {
            notDeleteMessages.push(message);
          } else {
            deleteMessages.push(message);
          }
        }
        
        for (const message of deleteMessages) {
          try {
            const editMessage = await bot.telegram.editMessageText(message.chatId, message.messageId, undefined, "Deleting...");
            // const checkMessage = await bot.telegram.getChatMember(CHAT_ID, message.messageId);
            if (editMessage) {
              await bot.telegram.deleteMessage(message.chatId, message.messageId);
              
              infoLogger.log("info", `🟢 Delete the message.`);
            } else {
              errorLogger.log("error", `🔴 The message you want to delete does not exist. id - '${message.messageId}`);
            }
          } catch (e) {
            exceptionLogger.log("exception", `❌ Message lookup failed. id - '${message.messageId}`);
          }
        }

        writeFileSync(restrictFilePath, JSON.stringify(notDeleteMessages), { flag: 'w', encoding: 'utf8' });
      }
    } else {
      errorLogger.log("error", `🔴 Restrict file path is undefined`);
    }
  } else {
    errorLogger.log("error", `🔴 Token is undefined`);
  }
}

infoLogger.log("info", `🟢 Start community message scheduler`);
setInterval(startScheduler, 60 * 1000);