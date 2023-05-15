import { Injectable } from "@nestjs/common";

import * as fs from 'fs';

@Injectable()
export class MessageUtilService {
  private messages: { messageId: number; time: number } [];
  private filePath: string;

  constructor() {
    this.messages = [];
    this.filePath = "public/message.json";
  }

  addMessage(messageId: number, time: number) {
    this.messages.push({ messageId, time });
    this.saveToMessageFile();
  }

  getMessageByMessageId(messageId: number) {
    const message = this.messages.find((message) => message.messageId === messageId);
    return message ? message : null;
  }

  removeMessage(messageId: number) {
    const index = this.messages.findIndex(obj => obj.messageId === messageId);

    if (index !== -1) {
      this.messages.splice(index, 1);
    }

    this.saveToMessageFile();
  }
  
  saveToMessageFile() {
    const data = JSON.stringify(this.messages);
    fs.writeFileSync(this.filePath, data, 'utf-8');
  }

  loadFromMessageFile() {
    if (fs.existsSync(this.filePath)) {
      const rawData = fs.readFileSync(this.filePath, 'utf-8');
      this.messages = JSON.parse(rawData);
    }
  }
}