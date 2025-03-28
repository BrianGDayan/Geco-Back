import { Module } from '@nestjs/common';
import { TrabajadoresService } from './trabajadores.service';
import { TrabajadoresJobs } from './trabajadores.jobs';
import { PrismaModule } from '../prisma/prisma.module';
import { TrabajadoresController } from './trabajadores.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TrabajadoresController],
  providers: [TrabajadoresService, TrabajadoresJobs],
  exports: [TrabajadoresService],
})
export class TrabajadoresModule {}

