import { Ctx, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry, Timeout } from '@nestjs/schedule';

import { getAlertMessage, getRestrictPermission, getWelcomeNotice } from '../common/message.common';

@Update()
export class TelegrafBotService {
  private messageTimeouts = new Map<number, NodeJS.Timeout>();
  private startDate: number;

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private configService: ConfigService, 
  ) {
    this.startDate = Math.floor(new Date().getTime() / 1000);
  }

  @On('new_chat_members')
  async newChatMembers(@Ctx() ctx: Context): Promise<void> {
    // set variables
    const messageDate = ctx.message.date;
    const messageId = ctx.message.message_id;
    const isBot = ctx.message.from.is_bot;
    const userId = ctx.message.from.id;
    const userName = ctx.message.from.first_name;
    const languageCode = ctx.message.from.language_code;

    // Bot user detection
    if (isBot) {
      await ctx.banChatMember(userId);
      return ;
    }

    // Ignore past participation messages
    if (this.startDate >= messageDate) {
      return ;
    }

    // Delete group join message
    await ctx.deleteMessage(messageId);

    // Setting restrict permissions for users who participate in a group
    await ctx.restrictChatMember(userId, {
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

    // 
    const restrictPermission = getRestrictPermission(languageCode, userName);
    restrictPermission.query.reply_markup.inline_keyboard[0][0].callback_data = userId.toString();
    
    const message = await ctx.reply(restrictPermission.message, {
      reply_markup: restrictPermission.query.reply_markup
    });

    const callback = async () => {
      try {
        await ctx.deleteMessage(messageId);
      } catch (error) {
        console.error(error);
      } finally {
        this.messageTimeouts.delete(messageId);
      }
    }

    const timeout = setTimeout(callback, this.configService.get<number>('DELETE_MSG_TIMEOUT') * 1000 * 60);
    this.messageTimeouts.set(message.message_id, timeout);
  }

  @On('callback_query')
  async callbackQuery(@Ctx() ctx: Context): Promise<void> {
    let languageCode = "";

    // If the message has been deleted
    if (ctx.callbackQuery === undefined) {
      languageCode = ctx.callbackQuery.from.language_code;
      await ctx.answerCbQuery(getAlertMessage(languageCode, "alertNotFoundMessage"), {
        show_alert: true
      });

      return ;
    }

    // Queries the information of the user who pressed the Permission button.
    const userId = ctx.callbackQuery.from.id;
    const messageId = ctx.callbackQuery.message.message_id;
    const userName = ctx.callbackQuery.from.username;

    // Gets the callback query data.
    const queryUserId = JSON.parse(ctx.callbackQuery['data']);

    if (queryUserId !== userId) {
      // The button was pressed by a user who has already acquired permission.
      await ctx.answerCbQuery(getAlertMessage(languageCode, "alertUserCheck"), {
        show_alert: true
      });
      return ;

    } else if (queryUserId === userId) {
      // If you clicked your own message, turn off the restriction.
      await ctx.restrictChatMember(userId, {
        permissions: {
          can_send_messages: true
        }
      });

      // Delete message
      const timeout = this.messageTimeouts.get(messageId);
      if (timeout) {
        clearTimeout(timeout);
        await ctx.deleteMessage(messageId);

        this.messageTimeouts.delete(messageId);
        const notice = getWelcomeNotice(languageCode, userName);
        
        try {
          await ctx.sendPhoto({
            source: 'public/firmachain.png'
          }, {
            caption: notice.message,
            reply_markup: notice.query.reply_markup,
            parse_mode: 'Markdown'
          });
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  @On('left_chat_member')
  async leftChatMember(@Ctx() ctx: Context): Promise<void> {
    const messageDate = ctx.message.date;
    const messageId = ctx.message.message_id;
    const userId = ctx.message.from.id;

    if (this.startDate >= messageDate) {
      // winston log
      // Exclude users who accessed before running the bot.
      return ;
    }

    await ctx.deleteMessage(messageId);
  }

  @Timeout(1000 * 60 * 5)
  cleanup() {
    this.schedulerRegistry.getTimeouts().forEach((timeout) => {
      clearTimeout(timeout);
      this.schedulerRegistry.deleteTimeout(timeout);
    });
  }
}
