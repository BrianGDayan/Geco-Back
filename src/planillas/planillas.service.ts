import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanillaDto, DetalleDto, ElementoDto } from './dto/create-planilla.dto';
import { UpdateDetalleDto } from './dto/update-detalle.dto';

@Injectable()
export class PlanillasService {
    constructor(private prisma: PrismaService) {}

    async getPlanillaByNro(nroPlanilla: string, idTarea: number) {
        // Obtener la planilla por su número y filtra por tarea
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
                progreso: true,
                peso_total: true,
                pesos_diametro: true,
                rendimiento_global_corte_trabajador: true,
                rendimiento_global_doblado_trabajador: true,
                rendimiento_global_empaquetado_trabajador: true,
                rendimiento_global_corte_ayudante: true,
                rendimiento_global_doblado_ayudante: true,
                rendimiento_global_empaquetado_ayudante: true,
                elemento: {
                    select: {
                        id_elemento: true,
                        nombre_elemento: true,
                        detalle: {
                            select: {
                                id_detalle: true,
                                posicion: true,
                                especificacion: true,
                                tipo: true,
                                medida_diametro: true,
                                longitud_corte: true,
                                cantidad_unitaria: true,
                                nro_elementos: true,
                                nro_iguales: true,
                                cantidad_total: true,
                                progreso: true,
                                campos_modificados: true,
                                detalle_tarea: {
                                    where: { id_tarea: idTarea }, // Filtra por tarea
                                    select: {
                                        id_detalle_tarea: true,
                                        cantidad_acumulada: true,
                                        completado: true,
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
    
    // Obtener las planillas con un progreso específico (usada para mostrar planillas completadas donde progreso = 100)
    async getPlanillasByProgreso(progreso: number) {
        return this.prisma.planilla.findMany({
            where: { progreso: progreso },
            select: {
                nro_planilla: true,
                obra: true,
                nro_plano: true,
                sector: true,
                fecha: true,
                item: true,
                progreso: true,
            },
        });
    }

    // Obtener las planillas con un progreso menor a un valor específico (usada para mostrar planillas en curso donde progreso < 100)
    async getPlanillasByProgresoLessThan(progreso: number) {
        return this.prisma.planilla.findMany({
            where: { progreso: { lt: progreso } },
            select: {
                nro_planilla: true,
                obra: true,
                nro_plano: true,
                sector: true,
                fecha: true,
                item: true,
                progreso: true,
            },
        });
    }

    async obtenerObras() {
        const obras = await this.prisma.planilla.findMany({
            distinct: ['obra'],
            select: { obra: true }
        });
        return obras.map(o => o.obra);
    }

   
    async createPlanilla(createPlanillaDto: CreatePlanillaDto, idUsuario: number) {
        // Crear la planilla junto con sus elementos y detalles
        const tareas = [1, 2, 3];
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
                            this.createElementoData(elemento, tareas)
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

    // Método auxiliar para crear los datos del elemento
    private createElementoData(elemento: ElementoDto, tareas: number[]) {
        return {
            nombre_elemento: elemento.nombre,
            detalle: {
                create: elemento.detalle.map(detalle => 
                    this.createDetalleData(detalle, tareas)
                ),
            },
        };
    }

    // Método auxiliar para crear los datos del detalle
    private createDetalleData(detalle: DetalleDto, tareas: number[]) {
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
            detalle_tarea: {
                create: tareas.map(id_tarea => ({
                    id_tarea,
                    cantidad_acumulada: 0,
                    completado: false,
                })),
            },
        };
    }

    // Método para actualizar un detalle específico
    async updateDetalle(idDetalle: number, updateDetalleDto: UpdateDetalleDto & { cantidadTotal?: number }) {
    return this.prisma.$transaction(async (prisma) => {
        // 1) Obtener el detalle actual con campos_modificados
        const detalleActual = await prisma.detalle.findUnique({
        where: { id_detalle: idDetalle },
        });

        if (!detalleActual) {
        throw new NotFoundException(`Detalle con ID ${idDetalle} no encontrado`);
        }

        // 2) Extraer valores posibles del DTO
        const {
        especificacion,
        posicion,
        tipo,
        medidaDiametro,
        longitudCorte,
        cantidadTotal,
        } = updateDetalleDto;

        // 3) Detectar cuáles campos cambian comparando con el actual
        const nuevosModificados: string[] = [];
        if (especificacion   !== undefined && especificacion   !== detalleActual.especificacion)   nuevosModificados.push('especificacion');
        if (posicion         !== undefined && posicion         !== detalleActual.posicion)         nuevosModificados.push('posicion');
        if (tipo             !== undefined && tipo             !== detalleActual.tipo)             nuevosModificados.push('tipo');
        if (medidaDiametro   !== undefined && medidaDiametro   !== detalleActual.medida_diametro)  nuevosModificados.push('medida_diametro');
        if (longitudCorte    !== undefined && longitudCorte    !== detalleActual.longitud_corte)   nuevosModificados.push('longitud_corte');
        if (cantidadTotal    !== undefined && cantidadTotal    !== detalleActual.cantidad_total)   nuevosModificados.push('cantidad_total');

        // 4) Recuperar previos y unir con nuevos
        const camposModificadosPrevios: string[] = Array.isArray(detalleActual.campos_modificados)
        ? (detalleActual.campos_modificados as string[])
        : [];

        const camposModificados = Array.from(new Set([...camposModificadosPrevios, ...nuevosModificados]));

        // 5) Armar data solo con lo que efectivamente cambió
        const dataToUpdate: any = { campos_modificados: camposModificados };

        if (especificacion !== undefined)  dataToUpdate.especificacion    = especificacion;
        if (posicion       !== undefined)  dataToUpdate.posicion          = posicion;
        if (tipo           !== undefined)  dataToUpdate.tipo              = tipo;
        if (medidaDiametro !== undefined)  dataToUpdate.medida_diametro   = medidaDiametro;
        if (longitudCorte  !== undefined)  dataToUpdate.longitud_corte    = longitudCorte;
        if (cantidadTotal  !== undefined)  dataToUpdate.cantidad_total    = cantidadTotal;

        // 6) Actualizar en BD
        const detalleActualizado = await prisma.detalle.update({
        where: { id_detalle: idDetalle },
        data: dataToUpdate,
        });

        return detalleActualizado;
    });
    }

    // Método para múltiples detalles con incremento de revisión
    async updateDetallesBatch(
    nroPlanilla: string,
    updates: { idDetalle: number; updateDetalleDto: UpdateDetalleDto }[]
    ) {
    return this.prisma.$transaction(async (prisma) => {
        for (const { idDetalle, updateDetalleDto } of updates) {
        await this.updateDetalle(idDetalle, updateDetalleDto);
        }

        // Incrementa revisión de la planilla
        const planilla = await prisma.planilla.update({
        where: { nro_planilla: nroPlanilla },
        data: { revision: { increment: 1 } },
        });

        return planilla;
    });
    }


    // Método para eliminar una planilla junto con sus elementos, detalles, detlle_tarea y registros asociados
    async deletePlanilla(nroPlanilla: string) {
        try {
          const planillaEliminada = await this.prisma.planilla.delete({
            where: {
              nro_planilla: nroPlanilla,
            },
          });
          return planillaEliminada;
        } catch (error) {
          throw new BadRequestException('Error al eliminar la planilla.');
        }
      }
      
}
