import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogSistema } from './entities/logs_sistema.entity';
import { LogsSistemaService } from './logs_sistema.service';
import { LogsSistemaController } from './logs_sistemas.controller'; // 👈 1. Importa el controlador

@Module({
  imports: [TypeOrmModule.forFeature([LogSistema])],
  controllers: [LogsSistemaController], // 👈 2. Agrégalo aquí
  providers: [LogsSistemaService],
  exports: [LogsSistemaService],
})
export class LogsSistemaModule {}