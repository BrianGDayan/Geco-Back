import { Module } from '@nestjs/common';
import { ProgresoService } from './progreso.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProgresoService],
  exports: [ProgresoService], 
})
export class ProgresoModule {}
