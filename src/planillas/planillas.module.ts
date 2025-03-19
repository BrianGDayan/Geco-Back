import { Module } from '@nestjs/common';
import { PlanillasController } from './planillas.controller';
import { PlanillasService } from './planillas.service';
@Module({
    controllers: [PlanillasController],
    providers: [PlanillasService],
})
export class PlanillasModule {}
