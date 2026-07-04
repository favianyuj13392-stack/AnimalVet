import { PartialType } from '@nestjs/swagger';
import { CreateCatalogoVacunaDto } from './create-catalogo_vacuna.dto';

export class UpdateCatalogoVacunaDto extends PartialType(CreateCatalogoVacunaDto) {}
