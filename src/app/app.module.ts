import { Module } from '@nestjs/common';

import { TelegrafBotModule } from '../telegraf-bot/telegraf-bot.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.production'
    }),
    TelegrafBotModule,
  ],
})
export class AppModule {}
