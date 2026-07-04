import { Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { NotificacionSchedulerService } from './notificacion-scheduler.service';

@ApiTags('Scheduler de Notificaciones')
@ApiHeader({ name: 'x-bot-key', required: true })
@Controller('notificaciones/scheduler')
export class NotificacionSchedulerController {
  constructor(private readonly scheduler: NotificacionSchedulerService) {}

  @Post('ejecutar-todos')
  @ApiOperation({ summary: 'Ejecutar manualmente los 3 cron jobs (para pruebas)' })
  ejecutarTodos(@Req() req: any) {
    const key = req.headers['x-bot-key'];
    if (!key || key !== process.env.BOT_API_KEY) {
      throw new UnauthorizedException('API Key inválida.');
    }
    return this.scheduler.ejecutarTodosManual();
  }
}
