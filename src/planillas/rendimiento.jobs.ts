import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RendimientoService } from './rendimiento.service';

@Injectable()
export class RendimientoJobs {
  private readonly logger = new Logger(RendimientoJobs.name);

  constructor(private readonly rendimientoService: RendimientoService) {}

  // Ejecutar actualización de rendimientos cada Lunes y Jueves a las 00:00
  @Cron('0 0 * * 1,4')
  async handleCron() {
    this.logger.log('Ejecutando job de actualización de rendimientos...');
    try {
      await this.rendimientoService.actualizarRendimientosGlobales();
    } catch (error) {
      this.logger.error('Error en job de rendimientos:', error.stack);
    }
  }
}