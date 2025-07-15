import { BadRequestException, Controller, Get, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from "src/auth/guards/roles.guard";
import { TrabajadoresJobs } from './trabajadores.jobs';
import { TrabajadoresService } from './trabajadores.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/type/auth.types';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrabajadoresController {
  constructor(private readonly trabajadoresJobs: TrabajadoresJobs, private readonly trabajadoresService: TrabajadoresService) {}

  // Endpoint para obtener todos los trabajadores activos
  @Get('activos')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getActivos() {
    return this.trabajadoresService.findAllActivos();
  }
  
  // Endpoint para obtener el rendimiento de los trabajadores por tarea
  @Get('rendimiento-por-tarea')
  @Roles(UserRole.ADMIN)
  async getRendimientosPorTarea(@Query('idTarea', ParseIntPipe) idTarea: number) {
    // Validamos que el parámetro tareaId sea 1, 2 o 3.
    if (![1, 2, 3].includes(idTarea)) {
      throw new BadRequestException('Tarea inválida. Debe ser 1, 2 o 3.');
    }
    return this.trabajadoresService.obtenerRendimientosPorTarea(idTarea);
  }

  // Endpoint para actualizar los rendimientos manualmente
  @Post('actualizar-rendimientos')
  @Roles(UserRole.ADMIN)
  async actualizarRendimientos() {
    await this.trabajadoresJobs.ejecutarActualizacionManual();
    return { message: 'Actualización de rendimientos iniciada' };
  }
  
}