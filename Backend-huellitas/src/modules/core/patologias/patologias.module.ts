import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patologia } from './entities/patologia.entity';
import { PatologiasService } from './patologias.service';
import { PatologiasController } from './patologias.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Patologia])],
  controllers: [PatologiasController],
  providers: [PatologiasService],
  exports: [PatologiasService],
})
export class PatologiasModule {}
