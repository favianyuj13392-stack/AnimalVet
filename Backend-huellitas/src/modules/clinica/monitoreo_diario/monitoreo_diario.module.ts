import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoreoDiario } from './entities/monitoreo_diario.entity';
import { MonitoreoDiarioService } from './monitoreo_diario.service';
import { MonitoreoDiarioController } from './monitoreo_diario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MonitoreoDiario])],
  controllers: [MonitoreoDiarioController],
  providers: [MonitoreoDiarioService],
})
export class MonitoreoDiarioModule {}
