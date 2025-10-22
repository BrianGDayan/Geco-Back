import { BadRequestException, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TrabajadoresJobs } from './trabajadores.jobs';
import { TrabajadoresService } from './trabajadores.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/type/auth.types';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrabajadoresController {
  constructor(
    private readonly trabajadoresJobs: TrabajadoresJobs,
    private readonly trabajadoresService: TrabajadoresService,
  ) {}

  // Obtener todos los trabajadores activos
  @Get('activos')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getActivos() {
    return this.trabajadoresService.findAllActivos();
  }

  // Obtener rendimiento de trabajadores por tarea
  @Get('rendimiento-por-tarea')
  @Roles(UserRole.ADMIN)
  async getRendimientosPorTarea(@Query('idTarea', ParseIntPipe) idTarea: number) {
    if (![1, 2, 3].includes(idTarea)) {
      throw new BadRequestException('Tarea inválida. Debe ser 1, 2 o 3.');
    }
    return this.trabajadoresService.obtenerRendimientosPorTarea(idTarea);
  }

  // Ejecutar manualmente la actualización de rendimientos (para Render Cron Job)
  @Post('actualizar-rendimientos')
  async actualizarRendimientos() {
    await this.trabajadoresJobs.ejecutarActualizacionManual();
    return { ok: true, message: 'Actualización de rendimientos completada.' };
  }
}
