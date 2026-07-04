import { PartialType } from '@nestjs/swagger';
import { CreateTransaccionesCajaDto } from './create-transacciones_caja.dto';

export class UpdateTransaccionesCajaDto extends PartialType(CreateTransaccionesCajaDto) {}
