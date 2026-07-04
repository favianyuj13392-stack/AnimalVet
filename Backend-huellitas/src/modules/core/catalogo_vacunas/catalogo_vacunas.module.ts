import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoVacunasService } from './catalogo_vacunas.service';
import { CatalogoVacunasController } from './catalogo_vacunas.controller';
import { CatalogoVacuna } from './entities/catalogo_vacuna.entity';
import { EspeciesModule } from '../especies/especies.module'; // Importamos el módulo de especies

@Module({
  imports: [
    TypeOrmModule.forFeature([CatalogoVacuna]),
    EspeciesModule // <-- Clave para la validación cruzada
  ],
  controllers: [CatalogoVacunasController],
  providers: [CatalogoVacunasService],
  exports: [CatalogoVacunasService], // Se usará en el módulo Clínico al aplicar vacunas
})
export class CatalogoVacunasModule {}