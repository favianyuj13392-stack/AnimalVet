import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// Infraestructura
import { MyConfigModule } from './infraestructura/config/config.module';
import { MyDatabaseModule } from './infraestructura/database/database.module';

// Core
import { RolesModule } from './modules/core/roles/roles.module';
import { CatalogoVacunasModule } from './modules/core/catalogo_vacunas/catalogo_vacunas.module';
import { CategoriasProductoModule } from './modules/core/categorias_producto/categorias_productos.module';
import { ServiciosModule } from './modules/core/servicios/servicios.module';
import { RazasModule } from './modules/core/razas/razas.module';
import { EspeciesModule } from './modules/core/especies/especies.module';
import { ConfiguracionClinicaModule } from './modules/core/configuracion_clinica/configuracion_clinica.module';
import { LogsSistemaModule } from './modules/core/logs_sistema/logs_sistema.module';
import { PatologiasModule } from './modules/core/patologias/patologias.module';

// Identidad
import { UsuariosModule } from './modules/identidad/usuarios/usuarios.module';
import { MascotasModule } from './modules/identidad/mascotas/mascotas.module';

// Clínica
import { HorariosAtencionModule } from './modules/clinica/horarios_atencion/horarios_atencion.module';
import { CitasModule } from './modules/clinica/citas/citas.module';
import { HistorialClinicoModule } from './modules/clinica/historial_clinico/historial_clinico.module';
import { ArchivosAdjuntosModule } from './modules/clinica/archivos_adjuntos/archivos_adjuntos.module';
import { RecetasModule } from './modules/clinica/recetas/recetas.module';
import { DetallesRecetaModule } from './modules/clinica/detalles_receta/detalles_receta.module';
import { VacunasAplicadasModule } from './modules/clinica/vacunas_aplicadas/vacunas_aplicadas.module';
import { HospitalizacionesModule } from './modules/clinica/hospitalizaciones/hospitalizaciones.module';
import { MonitoreoDiarioModule } from './modules/clinica/monitoreo_diario/monitoreo_diario.module';
import { ExpedienteClinicoModule } from './modules/clinica/expediente_clinico/expediente_clinico.module';
import { PlantillasPatologiaModule } from './modules/clinica/plantillas_patologia/plantillas_patologia.module';
import { SeguimientosClinicosModule } from './modules/clinica/seguimientos_clinicos/seguimientos_clinicos.module';
import { InformesClinicosModule } from './modules/clinica/informes_clinicos/informes_clinicos.module';
import { ExamenesSolicitadosModule } from './modules/clinica/examenes_solicitados/examenes_solicitados.module';
import { ZoosanitarioModule } from './modules/zoosanitario/zoosanitario.module';

// Inventario
import { ProductosModule } from './modules/inventario/productos/productos.module';
import { LotesCaducidadModule } from './modules/inventario/lotes_caducidad/lotes_caducidad.module';
import { KardexInventarioModule } from './modules/inventario/kardex_inventario/kardex_inventario.module';

// Caja
import { TransaccionesCajaModule } from './modules/caja/transacciones_caja/transacciones_caja.module';
import { DetallesTransaccionModule } from './modules/caja/detalles_transaccion/detalles_transaccion.module';
import { CierresCajaModule } from './modules/caja/cierres_caja/cierres_caja.module';

// Comunicación
import { RegistroNotificacionesModule } from './modules/comunicacion/registro_notificaciones/registro_notificaciones.module';
import { RegistroEscaneoQRModule } from './modules/comunicacion/registro_escaneos_qr/registro_escaneos_qr.module';
import { InteraccionesBotModule } from './modules/comunicacion/interacciones_bot/interacciones_bot.module';
import { MensajeroModule } from './modules/comunicacion/mensajero/mensajero.module';
import { NotificacionSchedulerModule } from './modules/comunicacion/notificacion-scheduler/notificacion-scheduler.module';
import { BotApiModule } from './app/bot-api/bot-api.module';
import { AuthModule } from './modules/identidad/auth/auth.module';
import { ReportesModule } from './modules/reportes/reportes.module';

@Module({
  imports: [
    MyConfigModule,
    MyDatabaseModule,
    ...(process.env.VERCEL === '1' ? [] : [ScheduleModule.forRoot()]),

    // Core
    RolesModule,
    EspeciesModule,
    RazasModule,
    ServiciosModule,
    CategoriasProductoModule,
    ConfiguracionClinicaModule,
    CatalogoVacunasModule,
    LogsSistemaModule,

    // Identidad
    UsuariosModule,
    MascotasModule,

    // Clínica
    HorariosAtencionModule,
    CitasModule,
    HistorialClinicoModule,
    ArchivosAdjuntosModule,
    RecetasModule,
    DetallesRecetaModule,
    VacunasAplicadasModule,
    ExpedienteClinicoModule,
    HospitalizacionesModule,
    MonitoreoDiarioModule,
    PlantillasPatologiaModule,
    PatologiasModule,
    SeguimientosClinicosModule,
    InformesClinicosModule,
    ExamenesSolicitadosModule,
    ZoosanitarioModule,

    // Inventario
    ProductosModule,
    LotesCaducidadModule,
    KardexInventarioModule,

    // Caja
    CierresCajaModule,
    TransaccionesCajaModule,
    DetallesTransaccionModule,

    // Comunicación
    RegistroEscaneoQRModule,
    RegistroNotificacionesModule,
    InteraccionesBotModule,
    MensajeroModule,
    ...(process.env.VERCEL === '1' ? [] : [NotificacionSchedulerModule]),
    BotApiModule,
    AuthModule,
    ReportesModule,
  ],
})
export class AppModule {}