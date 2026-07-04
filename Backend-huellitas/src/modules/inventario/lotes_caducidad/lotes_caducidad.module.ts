import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoteCaducidad } from './entities/lotes_caducidad.entity';
import { LotesCaducidadService } from './lotes_caducidad.service';
import { LotesCaducidadController } from './lotes_caducidad.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoteCaducidad])],
  controllers: [LotesCaducidadController],
  providers: [LotesCaducidadService],
})
export class LotesCaducidadModule {}
