import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { RendimientoService } from './rendimiento.service';
import { RendimientoJobs } from './rendimiento.jobs';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [RendimientoService, RendimientoJobs],
  exports: [RendimientoService]
})
export class PlanillasModule {}