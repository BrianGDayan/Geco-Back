import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { RendimientoService } from './rendimiento.service';
import { RendimientoJobs } from './rendimiento.jobs';
import { PlanillasController } from './planillas.controller';
import { PlanillasService } from './planillas.service'; // si no estaba
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // si necesitás usarlo explícitamente
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, ScheduleModule.forRoot()],
  controllers: [PlanillasController],
  providers: [PlanillasService, RendimientoService, RendimientoJobs],
  exports: [RendimientoService]
})
export class PlanillasModule {}
