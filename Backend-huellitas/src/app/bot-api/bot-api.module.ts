import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../../modules/identidad/usuarios/entities/usuario.entity';
import { Mascota } from '../../modules/identidad/mascotas/entities/mascota.entity';
import { Servicio } from '../../modules/core/servicios/entities/servicio.entity';
import { CitasModule } from '../../modules/clinica/citas/citas.module';
import { InteraccionesBotModule } from '../../modules/comunicacion/interacciones_bot/interacciones_bot.module';
import { BotApiController } from './bot-api.controller';
import { BotProcesadorService } from './bot-procesador.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, Mascota, Servicio]),
    CitasModule,
    InteraccionesBotModule,
  ],
  controllers: [BotApiController],
  providers: [BotProcesadorService],
})
export class BotApiModule {}
