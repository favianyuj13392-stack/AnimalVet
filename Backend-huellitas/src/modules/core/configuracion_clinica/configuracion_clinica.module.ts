import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ConfiguracionClinica } from './entities/configuracion_clinica.entity';
import { ConfiguracionClinicaService } from './configuracion_clinica.service';
import { ConfiguracionClinicaController } from './configuracion_clinica.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ConfiguracionClinica])],
  controllers: [ConfiguracionClinicaController],
  providers: [ConfiguracionClinicaService],
})
export class ConfiguracionClinicaModule {}
