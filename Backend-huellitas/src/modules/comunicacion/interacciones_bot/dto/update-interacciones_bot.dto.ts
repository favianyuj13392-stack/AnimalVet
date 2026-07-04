import { PartialType } from '@nestjs/swagger';
import { CreateInteraccionesBotDto } from './create-interacciones_bot.dto';

export class UpdateInteraccionesBotDto extends PartialType(CreateInteraccionesBotDto) {}
