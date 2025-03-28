import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanillaDto, DetalleDto, ElementoDto } from './dto/create-planilla.dto';
import { UpdateDetalleDto } from './dto/update-detalle.dto';

@Injectable()
export class PlanillasService {
    constructor(private prisma: PrismaService) {}

    async getPlanillaByNro(nroPlanilla: string, tareaId: number) {
        return this.prisma.planilla.findUnique({
            where: { nro_planilla: nroPlanilla },
            select: {
                nro_planilla: true,
                obra: true,
                nro_plano: true,
                sector: true,
                encargado_elaborar: true,
                encargado_revisar: true,
                encargado_aprobar: true,
                fecha: true,
                revision: true,
                item: true,
                elemento: {
                    select: {
                        nombre_elemento: true,
                        detalle: {
                            select: {
                                posicion: true,
                                especificacion: true,
                                tipo: true,
                                medida_diametro: true,
                                longitud_corte: true,
                                cantidad_unitaria: true,
                                nro_elementos: true,
                                nro_iguales: true,
                                cantidad_total: true,
                                detalle_tarea: {
                                    where: { id_tarea: tareaId }, // Filtra por tarea
                                    select: {
                                        id_detalle_tarea: true,
                                        tarea: { select: { nombre_tarea: true } }, // Nombre de la tarea
                                        registro: {
                                            select: {
                                                id_registro: true,
                                                cantidad: true,
                                                fecha: true,
                                                horas_trabajador: true,
                                                horas_ayudante: true,
                                                rendimiento_trabajador: true,
                                                rendimiento_ayudante: true,
                                                trabajador: { select: { nombre: true } },
                                                ayudante: { select: { nombre: true } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    
    async getPlanillasByProgreso(progreso: number) {
        return this.prisma.planilla.findMany({
            where: { progreso: progreso },
        });
    }

    async getPlanillasByProgresoLessThan(progreso: number) {
        return this.prisma.planilla.findMany({
            where: { progreso: { lt: progreso } },
        });
    }

    async calcularRendimientoPromedioPorObra(obra: string) {
        const planillas = await this.prisma.planilla.findMany({
            where: { obra: obra },
            select: {
                rendimiento_global_corte: true,
                rendimiento_global_doblado: true,
                rendimiento_global_empaquetado: true,
            },
        });

        if (planillas.length === 0) {
            return {
                promedio_corte: 0,
                promedio_doblado: 0,
                promedio_empaquetado: 0,
            };
        }

        const totalCorte = planillas.reduce((sum, planilla) => sum + planilla.rendimiento_global_corte, 0);
        const totalDoblado = planillas.reduce((sum, planilla) => sum + planilla.rendimiento_global_doblado, 0);
        const totalEmpaquetado = planillas.reduce((sum, planilla) => sum + planilla.rendimiento_global_empaquetado, 0);

        const promedioCorte = totalCorte / planillas.length;
        const promedioDoblado = totalDoblado / planillas.length;
        const promedioEmpaquetado = totalEmpaquetado / planillas.length;

        return {
            promedio_corte: promedioCorte,
            promedio_doblado: promedioDoblado,
            promedio_empaquetado: promedioEmpaquetado,
        };
    }

   
    async createPlanilla(createPlanillaDto: CreatePlanillaDto, idUsuario: number) {
        return this.prisma.$transaction(async (prisma) => {
            const planilla = await prisma.planilla.create({
                data: {
                    nro_planilla: createPlanillaDto.nroPlanilla,
                    obra: createPlanillaDto.obra,
                    nro_plano: createPlanillaDto.nroPlano,
                    sector: createPlanillaDto.sector,
                    encargado_elaborar: createPlanillaDto.encargadoElaborar,
                    encargado_revisar: createPlanillaDto.encargadoRevisar,
                    encargado_aprobar: createPlanillaDto.encargadoAprobar,
                    fecha: createPlanillaDto.fecha,
                    item: createPlanillaDto.item,
                    id_usuario: idUsuario,
                    elemento: {
                        create: createPlanillaDto.elemento.map(elemento => 
                            this.createElementoData(elemento)
                        ),
                    },
                },
                include: {
                    elemento: {
                        include: {
                            detalle: {
                                include: {
                                    detalle_tarea: true,
                                },
                            },
                        },
                    },
                },
            });

            return planilla;
        });
    }

    private createElementoData(elemento: ElementoDto) {
        return {
            nombre_elemento: elemento.nombre,
            detalle: {
                create: elemento.detalle.map(detalle => 
                    this.createDetalleData(detalle)
                ),
            },
        };
    }

    private createDetalleData(detalle: DetalleDto) {
        return {
            especificacion: detalle.especificacion,
            posicion: detalle.posicion.toString(),
            tipo: detalle.tipo,
            medida_diametro: detalle.medidaDiametro,
            longitud_corte: detalle.longitudCorte,
            cantidad_unitaria: detalle.cantidadUnitaria,
            nro_elementos: detalle.nroElementos,
            nro_iguales: detalle.nroIguales,
            cantidad_total: detalle.cantidadUnitaria * detalle.nroElementos * detalle.nroIguales,
        };
    }

    async updateDetalle(idDetalle: number, updateDetalleDto: UpdateDetalleDto) {
        return this.prisma.$transaction(async (prisma) => {
            // 1. Obtener detalle actual con su elemento
            const detalleActual = await prisma.detalle.findUnique({
                where: { id_detalle: idDetalle },
                include: { elemento: true }
            });

            if (!detalleActual) {
                throw new NotFoundException(`Detalle con ID ${idDetalle} no encontrado`);
            }

            // 2. Calcular nueva cantidad_total si cambian los componentes
            let cantidadTotal = detalleActual.cantidad_total;
            if (updateDetalleDto.cantidadUnitaria || updateDetalleDto.nroElementos || updateDetalleDto.nroIguales) {
                const nuevaCantidadUnitaria = updateDetalleDto.cantidadUnitaria ?? detalleActual.cantidad_unitaria;
                const nuevoNroElementos = updateDetalleDto.nroElementos ?? detalleActual.nro_elementos;
                const nuevoNroIguales = updateDetalleDto.nroIguales ?? detalleActual.nro_iguales;
                
                if ([nuevaCantidadUnitaria, nuevoNroElementos, nuevoNroIguales].some(v => v <= 0)) {
                    throw new BadRequestException('Los valores deben ser mayores a 0');
                }
                
                cantidadTotal = nuevaCantidadUnitaria * nuevoNroElementos * nuevoNroIguales;
            }

            // 3. Actualizar el detalle
            const detalleActualizado = await prisma.detalle.update({
                where: { id_detalle: idDetalle },
                data: {
                    ...updateDetalleDto,
                    cantidad_total: cantidadTotal,
                    posicion: updateDetalleDto.posicion?.toString() ?? detalleActual.posicion,
                },
                include: { elemento: true }
            });

            // 4. Actualizar progresos en cascada
            await this.actualizarProgresoElemento(detalleActualizado.id_elemento);
            await this.actualizarProgresoPlanilla(detalleActualizado.elemento.nro_planilla);

            // 5. Incrementar revisión en planilla
            await prisma.planilla.update({
                where: { nro_planilla: detalleActualizado.elemento.nro_planilla },
                data: { revision: { increment: 1 } }
            });

            return detalleActualizado;
        });
    }

    private async actualizarProgresoElemento(idElemento: number) {
        const elemento = await this.prisma.elemento.findUnique({
            where: { id_elemento: idElemento },
            include: { detalle: true }
        });

        if (!elemento) return;

        const totalDetalles = elemento.detalle.length;
        const progresoPromedio = elemento.detalle.reduce((sum, d) => sum + d.progreso, 0) / totalDetalles;

        await this.prisma.elemento.update({
            where: { id_elemento: idElemento },
            data: { progreso: Math.round(progresoPromedio) }
        });
    }

    private async actualizarProgresoPlanilla(nroPlanilla: string) {
        const planilla = await this.prisma.planilla.findUnique({
            where: { nro_planilla: nroPlanilla },
            include: { elemento: true }
        });

        if (!planilla) return;

        const totalElementos = planilla.elemento.length;
        const progresoPromedio = planilla.elemento.reduce((sum, e) => sum + e.progreso, 0) / totalElementos;

        await this.prisma.planilla.update({
            where: { nro_planilla: nroPlanilla },
            data: { progreso: Math.round(progresoPromedio) }
        });
    }

}
