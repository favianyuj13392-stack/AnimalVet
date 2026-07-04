import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InteraccionBot } from './entities/interacciones_bot.entity';
import { InteraccionesBotService } from './interacciones_bot.service';
import { InteraccionesBotController } from './interacciones_bot.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InteraccionBot])],
  controllers: [InteraccionesBotController],
  providers: [InteraccionesBotService],
  exports: [InteraccionesBotService],
})
export class InteraccionesBotModule {}
