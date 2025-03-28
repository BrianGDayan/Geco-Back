import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrabajadoresJobs } from './trabajadores.jobs';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard)
export class TrabajadoresController {
  constructor(private readonly trabajadoresJobs: TrabajadoresJobs) {}

  @Post('actualizar-rendimientos')
  async actualizarRendimientos() {
    await this.trabajadoresJobs.ejecutarActualizacionManual();
    return { message: 'Actualización de rendimientos iniciada' };
  }
}