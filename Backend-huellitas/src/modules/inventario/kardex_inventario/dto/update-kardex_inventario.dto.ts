import { PartialType } from '@nestjs/swagger';
import { CreateKardexInventarioDto } from './create-kardex_inventario.dto';

export class UpdateKardexInventarioDto extends PartialType(CreateKardexInventarioDto) {}
