import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RendimientoService } from './rendimiento.service';

@Injectable()
export class RendimientoJobs {
  private readonly logger = new Logger(RendimientoJobs.name);

  constructor(private readonly rendimientoService: RendimientoService) {}

  // Ejecutar actualización de rendimientos cada día a la medianoche
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Ejecutando job de actualización de rendimientos...');
    try {
      await this.rendimientoService.actualizarRendimientosGlobales();
    } catch (error) {
      this.logger.error('Error en job de rendimientos:', error.stack);
    }
  }
}