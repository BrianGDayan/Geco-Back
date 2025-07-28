import { BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, Res, UseGuards, HttpStatus, ValidationPipe, UnauthorizedException } from "@nestjs/common";
import { Request, Response } from "express";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from "src/auth/guards/roles.guard";
import { CreatePlanillaDto } from "./dto/create-planilla.dto";
import { PlanillasService } from "./planillas.service";
import { UpdateDetalleDto } from "./dto/update-detalle.dto";
import { UserPayload, UserRole } from "src/auth/type/auth.types";
import { RendimientoService } from "./rendimiento.service";
import { Roles } from "src/auth/decorators/roles.decorator";

@Controller('planillas')
@UseGuards(JwtAuthGuard, RolesGuard)   
export class PlanillasController { 
 
    constructor(private readonly planillasService: PlanillasService, private readonly rendimientoService: RendimientoService) {}

    // Endpoint para obtener planillas completadas (progreso = 100)
    @Get('completadas')
    @Roles(UserRole.ADMIN)
    async getPlanillasCompletadas() {
        return this.planillasService.getPlanillasByProgreso(100);
    }
 
    // Endpoint para obtener planillas en curso (progreso < 100)
    @Get('en-curso')
    @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
    async getPlanillasEnCurso() {
        return this.planillasService.getPlanillasByProgresoLessThan(100);
    }

    // Endpoint para obtener obras
    @Get('obras')
    @Roles(UserRole.ADMIN)
    async getObras() {
    return this.planillasService.obtenerObras();
    }

    // Endpoint para obtener los rendimientos filtrados por obra
    @Get('rendimientos')
    @Roles(UserRole.ADMIN)
    async getRendimientosPorObra(@Query('obra') obra: string) {
        return this.rendimientoService.calcularRendimientosPorObra(obra);
    }

       // Endpoint para obtener todos los diametros
    @Get('diametros')
    @Roles(UserRole.ADMIN)
    async getDiametros() {
        return this.planillasService.findAllDiametros();
    }

    // Endpoint para obtener una planilla por el nro de planilla
    @Get(':nroPlanilla')
    @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
    async getPlanillaByNro(@Param('nroPlanilla') nroPlanilla: string, @Query('idTarea', new ParseIntPipe()) idTarea: number) {
        if (![1, 2, 3].includes(idTarea)) {
            throw new BadRequestException('Tarea inválida');
        }
        return this.planillasService.getPlanillaByNro(nroPlanilla, idTarea);
    }

    // Endpoint para obtener una planilla con todos sus registros y tareas
    @Get(':nroPlanilla/completa')
    @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
    async getPlanillaCompleta(
        @Param('nroPlanilla') nroPlanilla: string,
    ) {
        return this.planillasService.getPlanillaCompleta(nroPlanilla);
    }

    // Endpoint para crear una planilla
    @Post()
    @Roles(UserRole.ADMIN)
    async createPlanilla(@Body(ValidationPipe) createPlanillaDto: CreatePlanillaDto, @Req() req: Request, @Res() res: Response) {

        if (!req.user) {
            throw new UnauthorizedException('Usuario no autenticado');
        }
        
        const idUsuario = (req.user as any).id_usuario;
        const planilla = await this.planillasService.createPlanilla(createPlanillaDto, idUsuario);
        return res.status(HttpStatus.CREATED).json(planilla);
    }

    

    // Endpoint para modificar un detalle de planilla
    @Patch('detalles/:idDetalle')
    @Roles(UserRole.ADMIN)
    async updateDetalle(@Param('idDetalle', ParseIntPipe) idDetalle: number, @Body() updateDetalleDto: UpdateDetalleDto) {
        return this.planillasService.updateDetalle(idDetalle, updateDetalleDto);
    }

    // Endpoint para actualizar múltiples detalles y subir revision en 1
    @Patch(':nroPlanilla/detalles/batch')
    @Roles(UserRole.ADMIN)
    async updateDetallesBatch(@Param('nroPlanilla') rawNro: string, @Body() body: { updates: { idDetalle: number; updateDetalleDto: UpdateDetalleDto }[] }) {
        const nroPlanilla = rawNro.trim();
        return this.planillasService.updateDetallesBatch(nroPlanilla, body.updates);
    }
    // planillas.controller.ts
@Delete(':nroPlanilla')
@Roles(UserRole.ADMIN)
async deletePlanilla(@Param('nroPlanilla') nroPlanilla: string) {
  try {
    const planillaEliminada = await this.planillasService.deletePlanilla(nroPlanilla);
    return {
      message: 'Planilla eliminada exitosamente',
      planillaEliminada,
    };
  } catch (error: any) {
    // Le pasamos un objeto literal con tu mensaje + el detalle
    throw new BadRequestException({
      message: 'No se pudo eliminar la planilla',
      detail: error.message,
    });
  }
}
}
