import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { RendimientoService } from './rendimiento.service';
import { PlanillasController } from './planillas.controller';
import { PlanillasService } from './planillas.service'; 
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule, ScheduleModule.forRoot()],
  controllers: [PlanillasController],
  providers: [PlanillasService, RendimientoService],
  exports: [RendimientoService]
})
export class PlanillasModule {}
