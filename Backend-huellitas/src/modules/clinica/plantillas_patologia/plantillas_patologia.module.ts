import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlantillasPatologiaService } from './plantillas_patologia.service';
import { PlantillasPatologiaController } from './plantillas_patologia.controller';
import { PlantillaPatologia } from './entities/plantilla_patologia.entity';
import { PlantillaProductoRecomendado } from './entities/plantilla_producto_recomendado.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlantillaPatologia,
      PlantillaProductoRecomendado,
    ]),
  ],
  controllers: [PlantillasPatologiaController],
  providers: [PlantillasPatologiaService],
  exports: [PlantillasPatologiaService],
})
export class PlantillasPatologiaModule {}
