import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { BotModule } from 'src/bot/bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.production'
    }),
    BotModule
  ],
  controllers: [AppController],
  providers: []
})
export class AppModule {}
