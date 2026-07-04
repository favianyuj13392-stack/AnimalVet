import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosAdjuntosService } from './archivos_adjuntos.service';
import { ArchivosAdjuntosController } from './archivos_adjuntos.controller';
import { ArchivoAdjunto } from './entities/archivos_adjunto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArchivoAdjunto])],

  controllers: [ArchivosAdjuntosController],
  providers: [ArchivosAdjuntosService],
})
export class ArchivosAdjuntosModule {}
