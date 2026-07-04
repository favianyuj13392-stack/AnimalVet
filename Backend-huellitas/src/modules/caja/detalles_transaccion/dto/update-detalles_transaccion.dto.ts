import { PartialType } from '@nestjs/swagger';
import { CreateDetallesTransaccionDto } from './create-detalles_transaccion.dto';

export class UpdateDetallesTransaccionDto extends PartialType(CreateDetallesTransaccionDto) {}
