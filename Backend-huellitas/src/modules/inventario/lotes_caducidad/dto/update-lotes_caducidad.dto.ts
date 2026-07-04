import { PartialType } from '@nestjs/swagger';
import { CreateLotesCaducidadDto } from './create-lotes_caducidad.dto';

export class UpdateLotesCaducidadDto extends PartialType(CreateLotesCaducidadDto) {}
