import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, ValidationPipe } from "@nestjs/common";
import { CreatePlanillaDto } from "./dto/create-planilla.dto";
import { UpdatePlanillaDto } from "./dto/update-planilla.dto";
import { PlanillasService } from "./planillas.service";

@Controller('planillas')
export class PlanillasController { 
 
    constructor(private readonly planillasService: PlanillasService) {}

    // Endpoint para obtener una planilla por el nro de planilla
    @Get(':nroPlanilla')
    async getPlanillaByNro(@Param('nroPlanilla') nroPlanilla: string, @Query('tareaId', new ParseIntPipe()) tareaId: number) {
        if (![1, 2, 3].includes(tareaId)) {
            throw new BadRequestException('Tarea inválida');
        }
        return this.planillasService.getPlanillaByNro(nroPlanilla, tareaId);
    }
     
    // Endpoint para obtener planillas completadas (progreso = 100)
    @Get('completadas')
    async getPlanillasCompletadas() {
        return this.planillasService.getPlanillasByProgreso(100);
    }
 
    // Endpoint para obtener planillas en curso (progreso < 100)
    @Get('en-curso')
    async getPlanillasEnCurso() {
        return this.planillasService.getPlanillasByProgresoLessThan(100);
    }

    @Get('rendimiento-por-obra/:obra')
    async getRendimientoPorObra(@Param('obra') obra: string) {
        return this.planillasService.calcularRendimientoPromedioPorObra(obra);
    }

    @Post()
    async createPlanilla(@Body(ValidationPipe) createPlanillaDto: CreatePlanillaDto) {
      
    }

}