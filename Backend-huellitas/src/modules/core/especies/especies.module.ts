import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EspeciesService } from './especies.service';
import { EspeciesController } from './especies.controller';
import { Especie } from './entities/especie.entity';

@Module({
  imports: [

    TypeOrmModule.forFeature([Especie])
  ],
  controllers: [EspeciesController],
  providers: [EspeciesService],
  exports: [EspeciesService],
})
export class EspeciesModule {}