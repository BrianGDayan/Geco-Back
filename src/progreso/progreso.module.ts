import { Module } from '@nestjs/common';
import { ProgresoService } from './progreso.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PlanillasModule } from '../planillas/planillas.module';

@Module({
  imports: [PrismaModule, PlanillasModule],
  providers: [ProgresoService],
  exports: [ProgresoService], 
})
export class ProgresoModule {}
