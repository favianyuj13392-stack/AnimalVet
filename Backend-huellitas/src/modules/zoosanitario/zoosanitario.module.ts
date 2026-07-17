import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ZoosanitarioService } from './zoosanitario.service';
import { ZoosanitarioController } from './zoosanitario.controller';
import { Desparasitacion } from './desparasitaciones/entities/desparasitacion.entity';
import { CirugiaRegistro } from './cirugias/entities/cirugia-registro.entity';
import { TratamientoZoosanitario } from './tratamientos-zoo/entities/tratamiento-zoo.entity';
import { ProgramaSanitarioItem } from './programa-sanitario/entities/programa-sanitario-item.entity';
import { VacunaAplicada } from '../clinica/vacunas_aplicadas/entities/vacunas_aplicada.entity';
import { Mascota } from '../identidad/mascotas/entities/mascota.entity';
import { ConfiguracionClinica } from '../core/configuracion_clinica/entities/configuracion_clinica.entity';
import { VacunasAplicadasModule } from '../clinica/vacunas_aplicadas/vacunas_aplicadas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Desparasitacion,
      CirugiaRegistro,
      TratamientoZoosanitario,
      ProgramaSanitarioItem,
      VacunaAplicada,
      Mascota,
      ConfiguracionClinica,
    ]),
    VacunasAplicadasModule, // Para reusar VacunasAplicadasService
  ],
  controllers: [ZoosanitarioController],
  providers: [ZoosanitarioService],
  exports: [ZoosanitarioService],
})
export class ZoosanitarioModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // Backfill desde Historial Clínico
      await queryRunner.query(`
        UPDATE vacunas_aplicadas va
        SET id_mascota_fk = ec.id_mascota_fk
        FROM historial_clinico hc
        JOIN expediente_clinico ec ON hc.id_expediente_fk = ec.id
        WHERE va.id_historial_fk = hc.id
        AND va.id_mascota_fk IS NULL;
      `);

      // Backfill desde Hospitalización
      await queryRunner.query(`
        UPDATE vacunas_aplicadas va
        SET id_mascota_fk = hosp.id_mascota_fk
        FROM hospitalizaciones hosp
        WHERE va.id_hospitalizacion_fk = hosp.id
        AND va.id_mascota_fk IS NULL;
      `);

      await queryRunner.release();
      console.log('[ZoosanitarioModule] Backfill de id_mascota_fk en vacunas_aplicadas completado.');
    } catch (err) {
      console.error('[ZoosanitarioModule] Error ejecutando backfill de vacunas:', err);
    }
  }
}
