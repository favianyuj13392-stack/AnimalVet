import { PartialType } from '@nestjs/swagger';
import { CreateRegistroNotificacioneDto } from './create-registro_notificacione.dto';

export class UpdateRegistroNotificacioneDto extends PartialType(CreateRegistroNotificacioneDto) {}
