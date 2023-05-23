import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { readFileSync, writeFileSync } from 'fs';

import { MessageInfo } from '../interfaces/message.interface';
import { LOGGER_EXCEPTION } from '../common/logger.common';

@Injectable()
export class FileService {
  private restrictFilePath: string;
  private noticeFilePath: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {
    this.restrictFilePath = this.configService.get<string>('RESTRICT_FILE_PATH');
    this.noticeFilePath = this.configService.get<string>('NOTICE_FILE_PATH');
  }

  readRestrictFile(): MessageInfo[] {
    try {
      const content = readFileSync(this.restrictFilePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      this.logger.log(LOGGER_EXCEPTION, `❌ Error in "readRestrictFile" function. error - ${e}`);
      return [];
    }
  }

  writeRestrictFile(content: MessageInfo[]) {
    try {
      writeFileSync(this.restrictFilePath, JSON.stringify(content), { flag: 'w', encoding: 'utf8' });
    } catch (e) {
      this.logger.log(LOGGER_EXCEPTION, `❌ Error in "writeRestrictFile" function. error - ${e}`);
    }
  }

  appendRestrictMessage(chatId: number, messageId: number, expireAt: number) {
    const messages = this.readRestrictFile();
    messages.push({ chatId, messageId, expireAt });
    this.writeRestrictFile(messages);
  }

  removeRestrictMessage(chatId: number, messageId: number) {
    const messages = this.readRestrictFile();
    const newMessages = messages.filter(message => message.chatId !== chatId || message.messageId !== messageId);
    this.writeRestrictFile(newMessages);
  }

  readNoticeFile(): MessageInfo[] {
    try {
      const content = readFileSync(this.noticeFilePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      this.logger.log(LOGGER_EXCEPTION, `❌ Error in "readNoticeFile" function. error - ${e}`);
      return [];
    }
  }

  writeNoticeFile(content: MessageInfo[]) {
    try {
      writeFileSync(this.noticeFilePath, JSON.stringify(content), { flag: 'w', encoding: 'utf8' });
    } catch (e) {
      this.logger.log(LOGGER_EXCEPTION, `❌ Error in "writeNoticeFile" function. error - ${e}`);
    }
  }

  appendNoticeMessage(chatId: number, messageId: number) {
    const messages = this.readNoticeFile();
    messages.push({ chatId, messageId });
    this.writeNoticeFile(messages);
  }

  shiftNoticeMessage() {
    const messages = this.readNoticeFile();

    if (messages.length >= 2) {
      const popData = messages.shift();
      this.writeNoticeFile(messages);
      return popData;
    } else {
      return null;
    }
  }
}