import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanillaDto } from './dto/create-planilla.dto';
import { UpdatePlanillaDto } from './dto/update-planilla.dto';

@Injectable()
export class PlanillasService {
    constructor(private prisma: PrismaService) {}

   async getPlanillas(progreso?: number) {
        const planillas = await this.prisma.planilla.findMany({
            where: progreso ? { progreso } : {}, 
    })
    
}
}
