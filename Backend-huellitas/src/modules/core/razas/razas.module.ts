import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RazasService } from './razas.service';
import { RazasController } from './razas.controller';
import { Raza } from './entities/raza.entity';
// Importamos el módulo de la tabla foránea
import { EspeciesModule } from '../especies/especies.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Raza]),
    EspeciesModule // <-- Clave para que funcione la validación de especie
  ],
  controllers: [RazasController],
  providers: [RazasService],
})
export class RazasModule {}