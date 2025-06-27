import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TrabajadoresService } from './trabajadores.service';

@Injectable()
export class TrabajadoresJobs {
  private readonly logger = new Logger(TrabajadoresJobs.name);

  constructor(private readonly trabajadoresService: TrabajadoresService) {}

   // Ejecutar actualización de rendimientos cada Lunes y Jueves a las 00:00
  //  @Cron('0 0 * * 1,4')
  @Cron('0 */5 * * * *') // Cada 5 minutos, en el segundo 0
   async handleCron() {
     this.logger.log('Iniciando actualización de rendimientos...');
     await this.trabajadoresService.actualizarRendimientosSemanal();
     this.logger.log('Actualización completada');
   }

  // Opcional: Método para ejecución manual
  async ejecutarActualizacionManual() {
    await this.handleCron();
  }
}