import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CierreCaja } from './entities/cierres_caja.entity';
import { CierresCajaService } from './cierres_caja.service';
import { CierresCajaController } from './cierres_caja.controller';
import { TransaccionCaja } from '../transacciones_caja/entities/transacciones_caja.entity';
import { LogsSistemaModule } from '../../core/logs_sistema/logs_sistema.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CierreCaja, TransaccionCaja]),
    LogsSistemaModule,
  ],
  controllers: [CierresCajaController],
  providers: [CierresCajaService],
})
export class CierresCajaModule {}
