import { Module } from '@nestjs/common';
import { RegistrosController } from './registros.controller';
import { RegistrosService } from './registros.service';
import { ProgresoModule } from '../progreso/progreso.module';
import { PlanillasModule } from '../planillas/planillas.module';


@Module({
  imports: [ProgresoModule, PlanillasModule],
  controllers: [RegistrosController],
  providers: [RegistrosService],
})
export class RegistrosModule {}
