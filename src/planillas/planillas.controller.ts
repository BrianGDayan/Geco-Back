import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, ValidationPipe } from "@nestjs/common";
import { CreatePlanillaDto } from "./dto/create-planilla.dto";
import { UpdatePlanillaDto } from "./dto/update-planilla.dto";
import { PlanillasService } from "./planillas.service";

@Controller({})
export class PlanillasController { 
 
    constructor(private readonly planillasService: PlanillasService) {}

    @Get()
    getPlanillas(@Query('obra') obra?: string) {
        return this.planillasService.getPlanillas(rol);
    }

    @Get(':id')
    getPlanillasById(@Param('id', ParseIntPipe) id: number) {
        return this.planillasService.getPlanillasById(id);
    } 

    @Post()
    createPlanilla(@Body(ValidationPipe) createPlanillaDto: CreatePlanillaDto) {
        return this.planillasService.createPlanilla(createPlanillaDto);
    }

    @Patch(':id')
    updatePlanilla(@Param('id', ParseIntPipe) id: number, @Body(ValidationPipe) updatePlanillaDto: UpdatePlanillaDto) {
        return this.planillasService.updatePlanilla(id, updatePlanillaDto);
    }

    @Delete(':id')
    deletePlanilla(@Param('id', ParseIntPipe) id: number) {
        return this.planillasService.deletePlanilla(id);
    }
}