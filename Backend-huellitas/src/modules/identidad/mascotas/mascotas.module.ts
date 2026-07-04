import { Module } from '@nestjs/common';
import { MascotasService } from './mascotas.service';
import { MascotasController } from './mascotas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mascota } from './entities/mascota.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { Raza } from '../../core/razas/entities/raza.entity';
import { Especie } from '../../core/especies/entities/especie.entity';
import { ExpedienteClinicoModule } from '../../clinica/expediente_clinico/expediente_clinico.module';
import { CitasModule } from '../../clinica/citas/citas.module';
import { LogsSistemaModule } from '../../core/logs_sistema/logs_sistema.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mascota, Usuario, Raza, Especie]),
    ExpedienteClinicoModule,
    CitasModule,
    LogsSistemaModule,
  ],
  controllers: [MascotasController],
  providers: [MascotasService],
  exports: [MascotasService],
})
export class MascotasModule {}