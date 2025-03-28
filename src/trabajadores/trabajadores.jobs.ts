import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrabajadoresService } from './trabajadores.service';

@Injectable()
export class TrabajadoresJobs {
  private readonly logger = new Logger(TrabajadoresJobs.name);

  constructor(private readonly trabajadoresService: TrabajadoresService) {}

  @Cron(CronExpression.EVERY_WEEK)
  async handleCron() {
    this.logger.log('Iniciando actualización semanal de rendimientos...');
    await this.trabajadoresService.actualizarRendimientosSemanal();
    this.logger.log('Actualización semanal completada');
  }

  // Opcional: Método para ejecución manual
  async ejecutarActualizacionManual() {
    await this.handleCron();
  }
}