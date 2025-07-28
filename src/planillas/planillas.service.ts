import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanillaDto, DetalleDto, ElementoDto } from './dto/create-planilla.dto';
import { UpdateDetalleDto } from './dto/update-detalle.dto';

@Injectable()
export class PlanillasService {
    private readonly logger = new Logger(PlanillasService.name);
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

    //Obtener una planilla completa con todos sus detalles y tareas
    async getPlanillaCompleta(nroPlanilla: string) {
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
                    select: {
                        id_detalle_tarea: true,
                        cantidad_acumulada: true,
                        completado: true,
                        tarea: { select: { nombre_tarea: true } },
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
                            ayudante: { select: { nombre: true } },
                        },
                        },
                    },
                    },
                },
                },
            },
            },
        },
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

    async findAllDiametros(): Promise<{ medida_diametro: number }[]> {
        const list = await this.prisma.diametro.findMany({
            select: { medida_diametro: true },
            orderBy: { medida_diametro: 'asc' },
        });
        return list;
    }
   
    async createPlanilla(createPlanillaDto: CreatePlanillaDto, idUsuario: number) {
    // Crear la planilla junto con sus elementos y detalles en una transacción
    const tareas = [1, 2, 3];
    const result = await this.prisma.$transaction(async (prisma) => {
        // Crear registro inicial de planilla
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
            progreso: 0,
            peso_total: 0,
            pesos_diametro: [],
            elemento: {
            create: createPlanillaDto.elemento.map((elem) =>
                this.createElementoData(elem, tareas)
            ),
            },
        },
        include: {
            elemento: {
            include: {
                detalle: {
                include: {
                    diametro: { select: { peso_por_metro: true } },
                },
                },
            },
            },
        },
        });

        // Calcular peso_total y pesos por diámetro basado en elementos creados
        const pesosPorDiametro: Record<number, number> = {};
        let pesoTotal = 0;

        for (const elem of planilla.elemento) {
        for (const det of elem.detalle) {
            const cantidadTotal = det.cantidad_total;
            const longitud = det.longitud_corte;
            const pesoMetro = det.diametro.peso_por_metro;

            const parcial = (longitud * cantidadTotal * pesoMetro) / 1000;

            pesoTotal += parcial;
            pesosPorDiametro[det.medida_diametro] =
            (pesosPorDiametro[det.medida_diametro] || 0) + parcial;
        }
        }

        const pesos_diametro = Object.entries(pesosPorDiametro)
        .map(([diam, peso]) => ({ diametro: Number(diam), peso }))
        .sort((a, b) => a.diametro - b.diametro);

        // Actualizar la planilla con los datos de peso (en toneladas)
        const updated = await prisma.planilla.update({
        where: { nro_planilla: planilla.nro_planilla },
        data: {
            peso_total: pesoTotal,
            pesos_diametro,
        },
        });

        return updated;

    });
    // Devolver la planilla actualizada
    return result;
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
        // 1) Obtener el detalle actual con diametro y elemento
        const detalleActual = await prisma.detalle.findUnique({
        where: { id_detalle: idDetalle },
        include: { diametro: true, elemento: true },
        });
        if (!detalleActual) {
        throw new NotFoundException(`Detalle con ID ${idDetalle} no encontrado`);
        }

        // 2) Guardar valores viejos para ajustar pesos
        const pesoMetroViejo = detalleActual.diametro.peso_por_metro;
        const parcialViejo =
        (detalleActual.longitud_corte *
            detalleActual.cantidad_total *
            pesoMetroViejo) /
        1000;

        // 3) Detectar y acumular campos modificados
        const camposPrevios: string[] = Array.isArray(detalleActual.campos_modificados)
        ? (detalleActual.campos_modificados as unknown[]).filter((v): v is string => typeof v === 'string')
        : [];
        const nuevos: string[] = [];
        if (
        updateDetalleDto.longitudCorte !== undefined &&
        updateDetalleDto.longitudCorte !== detalleActual.longitud_corte
        ) nuevos.push('longitud_corte');
        if (
        updateDetalleDto.cantidadTotal !== undefined &&
        updateDetalleDto.cantidadTotal !== detalleActual.cantidad_total
        ) nuevos.push('cantidad_total');
        if (
        updateDetalleDto.medidaDiametro !== undefined &&
        updateDetalleDto.medidaDiametro !== detalleActual.medida_diametro
        ) nuevos.push('medida_diametro');
        // (y así para los demás campos que quieras trackear...)
        const campos_modificados = Array.from(new Set([...camposPrevios, ...nuevos]));

        // 4) Hacer el update, mapeando camelCase → snake_case
        const detalleActualizado = await prisma.detalle.update({
        where: { id_detalle: idDetalle },
        data: {
            ...(updateDetalleDto.especificacion !== undefined && { especificacion: updateDetalleDto.especificacion }),
            ...(updateDetalleDto.posicion       !== undefined && { posicion:       updateDetalleDto.posicion }),
            ...(updateDetalleDto.tipo           !== undefined && { tipo:           updateDetalleDto.tipo }),
            ...(updateDetalleDto.medidaDiametro !== undefined && { medida_diametro: updateDetalleDto.medidaDiametro }),
            ...(updateDetalleDto.longitudCorte  !== undefined && { longitud_corte:  updateDetalleDto.longitudCorte }),
            ...(updateDetalleDto.cantidadTotal  !== undefined && { cantidad_total:  updateDetalleDto.cantidadTotal }),
            campos_modificados,
        },
        include: { diametro: true, elemento: true },
        });

        // 5) Calcular el nuevo peso parcial y el delta
        const pesoMetroNuevo = detalleActualizado.diametro.peso_por_metro;
        const parcialNuevo =
        (detalleActualizado.longitud_corte *
            detalleActualizado.cantidad_total *
            pesoMetroNuevo) /
        1000;
        const delta = parcialNuevo - parcialViejo;

        // 6) Ajustar los pesos en la planilla
        const planilla = await prisma.planilla.findUnique({
        where: { nro_planilla: detalleActualizado.elemento.nro_planilla },
        select: { peso_total: true, pesos_diametro: true },
        });
        if (!planilla) {
        throw new NotFoundException(
            `Planilla ${detalleActualizado.elemento.nro_planilla} no encontrada`
        );
        }

        const nuevoPesoTotal = planilla.peso_total + delta;
        const pesosArray = planilla.pesos_diametro as Array<{ diametro: number; peso: number }>;
        const idx = pesosArray.findIndex(p => p.diametro === detalleActualizado.medida_diametro);
        if (idx >= 0) {
        pesosArray[idx].peso += delta;
        } else {
        pesosArray.push({ diametro: detalleActualizado.medida_diametro, peso: parcialNuevo });
        }

        // 7) Persistir los nuevos pesos
        await prisma.planilla.update({
        where: { nro_planilla: detalleActualizado.elemento.nro_planilla },
        data: {
            peso_total: nuevoPesoTotal,
            pesos_diametro: pesosArray,
        },
        });

        return detalleActualizado;
    });
    }


    // Método para múltiples detalles con incremento de revisión
    async updateDetallesBatch(
        nroPlanilla: string,
        updates: { idDetalle: number; updateDetalleDto: UpdateDetalleDto }[]
    ) {
        this.logger.log(`Iniciando batch update para planilla ${nroPlanilla} con ${updates.length} detalles`);
        return this.prisma.$transaction(async (prisma) => {
        try {
            for (const { idDetalle, updateDetalleDto } of updates) {
            this.logger.debug(`Actualizando detalle ${idDetalle}`);
            await this.updateDetalle(idDetalle, updateDetalleDto);
            }

            const planilla = await prisma.planilla.update({
            where: { nro_planilla: nroPlanilla },
            data: { revision: { increment: 1 } },
            });
            this.logger.log(`Batch update completado para planilla ${nroPlanilla}`);
            return planilla;
        } catch (err) {
            this.logger.error(`Error en updateDetallesBatch para planilla ${nroPlanilla}`, err.stack);
            // Re-lanzamos para que el controller reciba el error y devuelva 500
            throw new BadRequestException('Error interno al actualizar detalles');
        }
        });
    }
    // planillas.service.ts
async deletePlanilla(nroPlanilla: string) {
  try {
    // Comprueba primero si existe, así podemos devolver 404 en lugar de 400
    const existe = await this.prisma.planilla.findUnique({
      where: { nro_planilla: nroPlanilla },
      select: { nro_planilla: true }
    });
    if (!existe) {
      throw new NotFoundException(`Planilla ${nroPlanilla} no existe.`);
    }

    // Ahora sí borramos
    return await this.prisma.planilla.delete({
      where: { nro_planilla: nroPlanilla },
    });
  } catch (error: any) {
    // Loguea el error para depuración
    this.logger.error(`Error borrando planilla ${nroPlanilla}`, error);
    // Re-lanza con el mensaje original
    throw new BadRequestException(
      `No se pudo eliminar la planilla: ${error.message}`
    );
  }
}
}
