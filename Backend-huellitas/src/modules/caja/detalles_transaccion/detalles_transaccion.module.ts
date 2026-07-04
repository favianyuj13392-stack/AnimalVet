import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetalleTransaccion } from './entities/detalles_transaccion.entity';
import { DetallesTransaccionService } from './detalles_transaccion.service';
import { DetallesTransaccionController } from './detalles_transaccion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DetalleTransaccion])],
  controllers: [DetallesTransaccionController],
  providers: [DetallesTransaccionService],
})
export class DetallesTransaccionModule {}
