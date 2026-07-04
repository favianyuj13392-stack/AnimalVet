import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KardexInventario } from './entities/kardex_inventario.entity';
import { KardexInventarioService } from './kardex_inventario.service';
import { KardexInventarioController } from './kardex_inventario.controller';
import { LogsSistemaModule } from '../../core/logs_sistema/logs_sistema.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KardexInventario]),
    LogsSistemaModule,
  ],
  controllers: [KardexInventarioController],
  providers: [KardexInventarioService],
})
export class KardexInventarioModule {}
