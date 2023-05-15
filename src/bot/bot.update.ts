import { Ctx, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

import { getAlertMessage, getRestrictPermission } from '../common/message.common';
import { MessageUtilService } from 'src/utils/message.util';

@Update()
export class BotUpdate {
  constructor(
    private readonly messageUtilService: MessageUtilService
  ) {
    this.startDate = Math.floor(new Date().getTime() / 1000);
  }

  private startDate: number;

  @On('new_chat_members')
  async newChatMembers(@Ctx() ctx: Context) {
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
    
    this.messageUtilService.addMessage(message.message_id, Math.floor(new Date().getTime() / 1000));

    setTimeout(async () => {
      try {
        const chatId = ctx.chat.id;
        // check delete message id
        await ctx.telegram.getChatMember(chatId, message.message_id);
        // 
        await ctx.deleteMessage(message.message_id);
      } catch (e) {
        // log (already delete message)
        console.log(e);

        setTimeout(async () => {
          const chatId = ctx.chat.id;
          // check delete message id
          await ctx.telegram.getChatMember(chatId, message.message_id);
          // 
          await ctx.deleteMessage(message.message_id);
        }, 5 * 60 * 1000);
      }
    }, 3 * 60 * 1000);
  }

  @On('left_chat_member')
  async leftChatMember(@Ctx() ctx: Context) {
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

  @On('callback_query')
  async callbackQuery(@Ctx() ctx: Context) {
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

      await ctx.deleteMessage(messageId)
    }
  }

  @On('message')
  async testMessage(@Ctx() ctx: Context) {
    // console.log(ctx.myChatMember);
    console.log(ctx.message);
  }

  async messageScheduler() {
    setInterval(() => {
      
    }, 5000);
  }
}

