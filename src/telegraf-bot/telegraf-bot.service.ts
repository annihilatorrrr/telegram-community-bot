import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, On, Update, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { User } from 'telegraf/typings/core/types/typegram';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { FileService } from '../file/file.service';
import { getAlertMessage, getRestrictPermission, getWelcomeNotice } from '../common/message.common';
import { LOGGER_BOTCHECK, LOGGER_ERROR, LOGGER_EXCEPTION, LOGGER_INFO } from '../common/logger.common';

@Injectable()
@Update()
export class TelegrafBotService {
  private groupChatId: string;
  private startTime: number;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
  ) {
    this.groupChatId = this.configService.get<string>('GROUP_CHAT_ID');
    this.startTime = Date.now();
  }

  @On('new_chat_members')
  async onNewChatMembers(@Ctx() ctx: Context): Promise<void> {
    if (ctx.chat.id.toString() === this.groupChatId) {
      if (this.startTime <= ctx.message.date) {
        return;
      }

      try {
        // Delete group join message
        await ctx.deleteMessage(ctx.message.message_id);
      } catch (e) {
        this.logger.log(LOGGER_EXCEPTION, `❌ Failed delete join message. * { firstName: ${ctx.message.from.first_name}, id: ${ctx.message.message_id}}`);
      }

      // Data exists unconditionally because this function is accessed only when an event defined in the decorator occurs.
      // So you don't have to use the phrase "try catch".
      const newChatMembers: User[] = ctx.update['message']['new_chat_members'];

      console.log(newChatMembers.length);
      for (const member of newChatMembers) {
        if (!member.is_bot) {
          this.logger.log(LOGGER_INFO, `🟢 Join member in group chat. * { name: ${member.first_name} id: ${member.id}}`);

          // Setting restrict permissions for users who participate in a group
          await ctx.restrictChatMember(member.id, {
            permissions: {
              can_send_messages: false,
              can_send_photos: false,
              can_send_videos: false,
              can_send_polls: false,
              can_change_info: false,
              can_invite_users: false,
              can_pin_messages: false,
              can_send_other_messages: false,
              can_add_web_page_previews: false
            }
          });

          const languageCode = ctx.message.from.language_code;
          const firstName = ctx.message.from.first_name;
          const chatId = ctx.chat.id;

          try {
            const restrictInfo = getRestrictPermission(languageCode, firstName);
            const restrictMessage = await ctx.reply(restrictInfo.message, Markup.inlineKeyboard([
              Markup.button.callback(restrictInfo.button, `unrestrict-${member.id}`)
            ]));

            // Registering the message deletion scheduler.
            this.fileService.appendRestrictMessage(chatId, restrictMessage.message_id, Date.now());
          } catch (e) {
            this.logger.log(LOGGER_EXCEPTION, `❌ Failed restrict member. * { name: ${member.first_name} id: ${member.id}}`);
          }
        } else {
          try {
            // Bot account is banned
            await ctx.banChatMember(member.id);

            // Write log for ban log
            this.logger.log(LOGGER_BOTCHECK, `🟢 Bot user is banned. * { firstName: ${member.first_name}, id: ${member.id}}`);
          } catch (e) {
            this.logger.log(LOGGER_EXCEPTION, `❌ Failed banned bot user. * { firstName: ${member.first_name}, id: ${member.id}}`);
          }
        }
      }
    } else {
      // Show alert message
      try {
        await ctx.answerCbQuery("Unacceptable group channel.", {
          show_alert: true
        });
      } catch (e) {
        this.logger.log(LOGGER_EXCEPTION, `❌ Failed show alert message. * { firstName: null, id: null}`);
      }
    }
  }

  @Action(/unrestrict-.+/)
  async onCallbackQuery(@Ctx() ctx: Context): Promise<void> {
    try {
      if (ctx.callbackQuery !== undefined) {
        const queryData: string = ctx.callbackQuery['data'];
        const userId = parseInt(queryData.split('-')[1]);
        const messageId = ctx.callbackQuery.message.message_id;
        const languageCode = ctx.callbackQuery.from.language_code;
        const firstName = ctx.callbackQuery.from.first_name;
        const chatId = ctx.chat.id;

        if (ctx.callbackQuery.from.id === userId) {
          await ctx.restrictChatMember(userId, { permissions: { can_send_messages: true } });

          await ctx.deleteMessage(messageId);

          const notice = getWelcomeNotice(languageCode, firstName);
          const noticeMessage = await ctx.sendPhoto(
            {
              source: 'public/firmachain.png'
            }, {
            caption: notice.message,
            reply_markup: notice.query.reply_markup,
            parse_mode: 'Markdown'
          });

          this.fileService.appendNoticeMessage(chatId, noticeMessage.message_id);
          
          const shiftNoticeMessage = this.fileService.shiftNoticeMessage();
          if (shiftNoticeMessage !== null) {
            try {
              const editMessage = await ctx.telegram.editMessageReplyMarkup(
                shiftNoticeMessage.chatId,
                shiftNoticeMessage.messageId,
                "Deleting...",
                null);

              if (editMessage) {
                // Found the message and proceed with deletion.
                await ctx.deleteMessage(shiftNoticeMessage.messageId);

                this.logger.log(LOGGER_INFO, `🟢 Delete the message.`);
              } else {
                this.logger.log(LOGGER_ERROR, `🔴 The message you want to delete does not exist. id - '${shiftNoticeMessage.messageId}`);
              }
            } catch (e) {
              this.logger.log(LOGGER_EXCEPTION, `❌ Message lookup failed. id - '${shiftNoticeMessage.messageId}`);
            }
          }

          // Excludes deleted message IDs from text files.
          this.fileService.removeRestrictMessage(ctx.chat.id, messageId);
          this.logger.log(LOGGER_INFO, `🟢 Excludes deleted message IDs from text files.`);
        } else {
          await ctx.answerCbQuery(getAlertMessage(languageCode, "alertUserCheck"), {
            show_alert: true
          });
        }
      } else {
        // This is not an area where the languageCode variable exists.
        await ctx.answerCbQuery(getAlertMessage(ctx.callbackQuery.from.language_code, "alertNotFoundMessage"), {
          show_alert: true
        });
      }
    } catch (e) {
      this.logger.log(LOGGER_EXCEPTION, `❌ Error in CallbackQuery function. error - ${e}`);
    }
  }

  @On('left_chat_member')
  async leftChatMember(@Ctx() ctx: Context): Promise<void> {
    if (this.startTime <= ctx.message.date) {
      return;
    }

    await ctx.deleteMessage(ctx.message.message_id);
  }
}
