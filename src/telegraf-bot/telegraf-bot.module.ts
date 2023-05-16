import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';

import { TelegrafBotService } from './telegraf-bot.service';
import { SchedulerRegistry } from '@nestjs/schedule';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TOKEN'),
        middlewares: [session()],
      }),
      inject: [ConfigService]
    }),
  ],
  providers: [SchedulerRegistry, ConfigService, TelegrafBotService]
})
export class TelegrafBotModule {}
