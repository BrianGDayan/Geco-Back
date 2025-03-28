import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UseGuards, HttpStatus, ValidationPipe, UnauthorizedException } from "@nestjs/common";
import { Request, Response } from "express";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePlanillaDto } from "./dto/create-planilla.dto";
import { PlanillasService } from "./planillas.service";
import { UpdateDetalleDto } from "./dto/update-detalle.dto";
import { UserPayload } from "src/auth/type/auth.types";


@Controller('planillas')
@UseGuards(JwtAuthGuard)
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
    async createPlanilla(@Body(ValidationPipe) createPlanillaDto: CreatePlanillaDto, @Req() req: Request, @Res() res: Response) {

        if (!req.user) {
            throw new UnauthorizedException('Usuario no autenticado');
        }
        
        const idUsuario = (req.user as any).id_usuario;
        const planilla = await this.planillasService.createPlanilla(createPlanillaDto, idUsuario);
        return res.status(HttpStatus.CREATED).json(planilla);
    }

    @Patch('detalles/:id')
    @UseGuards(JwtAuthGuard)
    async updateDetalle(@Param('id', ParseIntPipe) id: number, @Body() updateDetalleDto: UpdateDetalleDto, @Req() req: Request & { user: UserPayload }) {
        return this.planillasService.updateDetalle(id, updateDetalleDto);
    }

}