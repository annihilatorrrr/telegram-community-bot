import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { existsSync, mkdirSync } from 'fs';

import { TelegrafBotModule } from '../telegraf-bot/telegraf-bot.module';
import {
  LOGGER_BOTCHECK,
  LOGGER_ERROR,
  LOGGER_EXCEPTION,
  LOGGER_INFO,
  winstonOptions
} from '../common/logger.common';

const logDir = 'logs/service/';
const infoLogDir = `${logDir}${LOGGER_INFO}`;
const errorLogDir = `${logDir}${LOGGER_ERROR}`;
const botCheckLogDir = `${logDir}${LOGGER_BOTCHECK}`;
const exceptionLogDir = `${logDir}${LOGGER_EXCEPTION}`;

if (!existsSync(infoLogDir)) mkdirSync(infoLogDir);
if (!existsSync(errorLogDir)) mkdirSync(errorLogDir);
if (!existsSync(botCheckLogDir)) mkdirSync(botCheckLogDir);
if (!existsSync(exceptionLogDir)) mkdirSync(exceptionLogDir);

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.production'
    }),
    WinstonModule.forRoot(winstonOptions),
    TelegrafBotModule,
  ],
})
export class AppModule {}
