import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { TelegrafModule } from "nestjs-telegraf";
import { session } from "telegraf";

import { BotUpdate } from "./bot.update";
import { MessageUtilService } from "src/utils/message.util";

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        // token: configService.get<string>('TOKEN'),
        token: '5379650980:AAGz87s3HQLfsrqUlFutYUmSPUJlYLD3vF4',
        middlewares: [session()]
      }),
      inject: [ConfigService]
    }),
  ],
  providers: [BotUpdate, MessageUtilService],
})
export class BotModule { }