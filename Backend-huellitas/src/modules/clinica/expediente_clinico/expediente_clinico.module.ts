// src/modules/clinica/expediente_clinico/expediente_clinico.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpedienteClinico } from './entities/expediente_clinico.entity';
import { ExpedienteClinicoService } from './expediente_clinico.service';
import { ExpedienteClinicoController } from './expediente_clinico.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExpedienteClinico])],
  controllers: [ExpedienteClinicoController],
  providers: [ExpedienteClinicoService],
  exports: [ExpedienteClinicoService], // Importante para usarlo en Historial Clínico
})
export class ExpedienteClinicoModule {}