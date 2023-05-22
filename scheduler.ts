import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';

dotenv.config({ path: '.env.production' });

export interface MessageInfo {
  chatId: number;
  messageId: number;
  expireAt?: number;
}

const startScheduler = async () => {
  console.log(`START SCHEDULING : ${Date.now()}`);
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
          console.log(Date.now() - message.expireAt!);
          console.log(3 * 60 * 1000);
          
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
              console.log('[RESTRICT] The message exists.');
              await bot.telegram.deleteMessage(message.chatId, message.messageId);
            } else {
              console.log('[RESTRICT] The message does not exist.');
            }
          } catch (e) {
            console.error('[RESTRICT] Failed to query message.');
          }
        }

        writeFileSync(restrictFilePath, JSON.stringify(notDeleteMessages), { flag: 'w', encoding: 'utf8' });
      }
    } else {
      console.error("RESTRICT_FILE_PATH IS UNDEFINED");
    }

    // 
  } else {
    console.error("TOKEN IS UNDEFINED");
  }
}

console.log("START SCHEDULER");
setInterval(startScheduler, 60 * 1000);