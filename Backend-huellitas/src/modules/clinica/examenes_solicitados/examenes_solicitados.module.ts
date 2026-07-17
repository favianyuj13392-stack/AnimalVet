import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamenSolicitado } from './entities/examen-solicitado.entity';
import { HistorialClinico } from '../historial_clinico/entities/historial_clinico.entity';
import { ExamenesSolicitadosService } from './examenes_solicitados.service';
import { ExamenesSolicitadosController } from './examenes_solicitados.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamenSolicitado,
      HistorialClinico,
    ]),
  ],
  controllers: [ExamenesSolicitadosController],
  providers: [ExamenesSolicitadosService],
  exports: [ExamenesSolicitadosService],
})
export class ExamenesSolicitadosModule {}
