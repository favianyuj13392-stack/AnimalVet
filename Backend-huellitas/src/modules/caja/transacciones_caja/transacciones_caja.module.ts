import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransaccionCaja } from './entities/transacciones_caja.entity';
import { ConfiguracionClinica } from '../../core/configuracion_clinica/entities/configuracion_clinica.entity';
import { TransaccionesCajaService } from './transacciones_caja.service';
import { TransaccionesCajaController } from './transacciones_caja.controller';
import { LogsSistemaModule } from '../../core/logs_sistema/logs_sistema.module';

@Module({
  imports: [TypeOrmModule.forFeature([TransaccionCaja, ConfiguracionClinica]), LogsSistemaModule],
  controllers: [TransaccionesCajaController],
  providers: [TransaccionesCajaService],
})
export class TransaccionesCajaModule {}
