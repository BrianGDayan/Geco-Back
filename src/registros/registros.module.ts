import { Module } from '@nestjs/common';
import { RegistrosController } from './registros.controller';
import { RegistrosService } from './registros.service';
import { ProgresoModule } from 'src/progreso/progreso.module';
import { PlanillasModule } from 'src/planillas/planillas.module';


@Module({
  imports: [ProgresoModule, PlanillasModule],
  controllers: [RegistrosController],
  providers: [RegistrosService],
})
export class RegistrosModule {}
