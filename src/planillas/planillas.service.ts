import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanillaDto, DetalleDto, ElementoDto } from './dto/create-planilla.dto';
import { UpdateDetalleDto } from './dto/update-detalle.dto';

@Injectable()
export class PlanillasService {
    private readonly logger = new Logger(PlanillasService.name);
    constructor(private prisma: PrismaService) {}

    async getPlanillaByNro(nroPlanilla: string, idTarea: number) {
        // Traer datos principales de la planilla
        const planilla = await this.prisma.planilla.findUnique({
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
            },
        });

        if (!planilla) return null;

        // Traer elementos relacionados (solo lo esencial)
        const elementos = await this.prisma.elemento.findMany({
            where: { nro_planilla: nroPlanilla },
            select: {
                id_elemento: true,
                nombre_elemento: true,
            },
        });

        // Traer detalles por elemento
        const detalles = await this.prisma.detalle.findMany({
            where: { id_elemento: { in: elementos.map(e => e.id_elemento) } },
            select: {
                id_detalle: true,
                posicion: true,
                especificacion: true,
                tipo: true,
                medida_diametro: true,
                longitud_corte: true,
                cantidad_unitaria: true,
                nro_elementos: true,
                cantidad_total: true,
                progreso: true,
                campos_modificados: true,
                id_elemento: true,
            },
        });

        // Traer detalle_tarea filtrado por idTarea
        const detalleTareas = await this.prisma.detalle_tarea.findMany({
            where: {
                id_detalle: { in: detalles.map(d => d.id_detalle) },
                id_tarea: idTarea,
            },
            select: {
                id_detalle_tarea: true,
                cantidad_acumulada: true,
                completado: true,
                id_detalle: true,
                tarea: { select: { nombre_tarea: true } },
            },
        });

        // Traer registros relacionados a detalle_tarea
        const detalleTareaIds = detalleTareas.map(dt => dt.id_detalle_tarea);
        const registros = await this.prisma.registro.findMany({
            where: { id_detalle_tarea: { in: detalleTareaIds } },
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
                id_detalle_tarea: true,
            },
        });

        // Reconstruir la estructura
        return {
            ...planilla,
            elemento: elementos.map(elem => ({
                ...elem,
                detalle: detalles
                    .filter(d => d.id_elemento === elem.id_elemento)
                    .map(det => ({
                        ...det,
                        detalle_tarea: detalleTareas
                            .filter(dt => dt.id_detalle === det.id_detalle)
                            .map(dt => ({
                                ...dt,
                                registro: registros.filter(r => r.id_detalle_tarea === dt.id_detalle_tarea),
                            })),
                    })),
            })),
        };
    }

    //Obtener una planilla completa con todos sus detalles y tareas
    async getPlanillaCompleta(nroPlanilla: string) {
        const planilla = await this.prisma.planilla.findUnique({
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
            },
        });

        if (!planilla) return null;

        const elementos = await this.prisma.elemento.findMany({
            where: { nro_planilla: nroPlanilla },
            select: {
                id_elemento: true,
                nombre_elemento: true,
            },
        });

        const detalles = await this.prisma.detalle.findMany({
            where: { id_elemento: { in: elementos.map(e => e.id_elemento) } },
            select: {
                id_detalle: true,
                posicion: true,
                especificacion: true,
                tipo: true,
                medida_diametro: true,
                longitud_corte: true,
                cantidad_unitaria: true,
                nro_elementos: true,
                cantidad_total: true,
                progreso: true,
                campos_modificados: true,
                id_elemento: true,
            },
        });

        const detalleTareas = await this.prisma.detalle_tarea.findMany({
            where: { id_detalle: { in: detalles.map(d => d.id_detalle) } },
            select: {
                id_detalle_tarea: true,
                cantidad_acumulada: true,
                completado: true,
                id_detalle: true,
                tarea: { select: { nombre_tarea: true } },
            },
        });

        const detalleTareaIds = detalleTareas.map(dt => dt.id_detalle_tarea);
        const registros = await this.prisma.registro.findMany({
            where: { id_detalle_tarea: { in: detalleTareaIds } },
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
                id_detalle_tarea: true,
            },
        });

        return {
            ...planilla,
            elemento: elementos.map(elem => ({
                ...elem,
                detalle: detalles
                    .filter(d => d.id_elemento === elem.id_elemento)
                    .map(det => ({
                        ...det,
                        detalle_tarea: detalleTareas
                            .filter(dt => dt.id_detalle === det.id_detalle)
                            .map(dt => ({
                                ...dt,
                                registro: registros.filter(r => r.id_detalle_tarea === dt.id_detalle_tarea),
                            })),
                    })),
            })),
        };
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
        const tareas = [1, 2, 3];

        return this.prisma.$transaction(
            async (prisma) => {
                // 1) Crear la planilla con elementos y detalles
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
                            create: createPlanillaDto.elemento.map(elem =>
                                this.createElementoData(elem, tareas)
                            ),
                        },
                    },
                    include: {
                        elemento: {
                            include: {
                                detalle: {
                                    include: {
                                        diametro: true,
                                    },
                                },
                            },
                        },
                    },
                });

                // 2) Calcular pesos
                const { pesoTotal, pesos_diametro } = this.calcularPesos(planilla.elemento);

                // 3) Actualizar planilla con los pesos
                return prisma.planilla.update({
                    where: { nro_planilla: planilla.nro_planilla },
                    data: { peso_total: pesoTotal, pesos_diametro },
                });
            },
            {
                timeout: 30000 // Aumentado a 30 segundos para evitar cierre prematuro de la transacción
            }
        );
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

    private createDetalleData(detalle: DetalleDto, tareas: number[]) {
        return {
            especificacion: detalle.especificacion,
            posicion: detalle.posicion.toString(),
            tipo: detalle.tipo,
            medida_diametro: detalle.medidaDiametro,
            longitud_corte: detalle.longitudCorte,
            cantidad_unitaria: detalle.cantidadUnitaria,
            nro_elementos: detalle.nroElementos,
            cantidad_total: detalle.cantidadUnitaria * detalle.nroElementos,
            detalle_tarea: {
                create: tareas.map(id_tarea => ({
                    id_tarea,
                    cantidad_acumulada: 0,
                    completado: false,
                })),
            },
        };
    }

    // Método auxiliar: construye el data para updateDetalle y los campos_modificados
    private buildUpdateData(
    detalleActual: any,
    updateDetalleDto: UpdateDetalleDto & { cantidadTotal?: number }
    ) {
    const mapping: Record<string, keyof typeof updateDetalleDto> = {
        especificacion: 'especificacion',
        posicion: 'posicion',
        tipo: 'tipo',
        medida_diametro: 'medidaDiametro',
        longitud_corte: 'longitudCorte',
        cantidad_total: 'cantidadTotal',
    };

    const data: any = {};
    const nuevos: string[] = [];

    for (const [dbField, dtoField] of Object.entries(mapping)) {
        const newValue = updateDetalleDto[dtoField];
        if (newValue !== undefined && newValue !== detalleActual[dbField]) {
        data[dbField] = newValue;
        nuevos.push(dbField);
        }
    }

    const prev = Array.isArray(detalleActual.campos_modificados)
        ? detalleActual.campos_modificados
        : [];

    return { data, campos_modificados: Array.from(new Set([...prev, ...nuevos])) };
    }

    // Método auxiliar: actualiza el array de pesos_diametro
    private updatePesosArray(
    pesosArray: Array<{ diametro: number; peso: number }>,
    detalleViejo: any,
    detalleNuevo: any,
    parcialViejo: number,
    parcialNuevo: number
    ) {
    // Cambió el diámetro → quitar del viejo y sumar al nuevo
    if (detalleNuevo.medida_diametro !== detalleViejo.medida_diametro) {
        const idxOld = pesosArray.findIndex(p => p.diametro === detalleViejo.medida_diametro);
        if (idxOld >= 0) {
        pesosArray[idxOld].peso -= parcialViejo;
        if (pesosArray[idxOld].peso <= 0) pesosArray.splice(idxOld, 1);
        }

        const idxNew = pesosArray.findIndex(p => p.diametro === detalleNuevo.medida_diametro);
        if (idxNew >= 0) {
        pesosArray[idxNew].peso += parcialNuevo;
        } else {
        pesosArray.push({ diametro: detalleNuevo.medida_diametro, peso: parcialNuevo });
        }
    } else {
        // Mismo diámetro → ajustar solo la diferencia
        const idx = pesosArray.findIndex(p => p.diametro === detalleNuevo.medida_diametro);
        if (idx >= 0) {
        pesosArray[idx].peso += parcialNuevo - parcialViejo;
        }
    }
    return pesosArray;
    }

    // Calcular pesos (total + por diámetro) a partir de los elementos creados
    private calcularPesos(elementos: any[]) {
    const pesosPorDiametro: Record<number, number> = {};
    let pesoTotal = 0;

    for (const elem of elementos) {
        for (const det of elem.detalle) {
        const parcial =
            (det.longitud_corte * det.cantidad_total * det.diametro.peso_por_metro) /
            1000;

        pesoTotal += parcial;
        pesosPorDiametro[det.medida_diametro] =
            (pesosPorDiametro[det.medida_diametro] || 0) + parcial;
        }
    }

    const pesos_diametro = Object.entries(pesosPorDiametro)
        .map(([diam, peso]) => ({ diametro: Number(diam), peso }))
        .sort((a, b) => a.diametro - b.diametro);

    return { pesoTotal, pesos_diametro };
    }

    // Método para actualizar un detalle específico
    async updateDetalle(idDetalle: number, updateDetalleDto: UpdateDetalleDto & { cantidadTotal?: number }) {
    return this.prisma.$transaction(async (prisma) => {
        // 1) cargar detalle actual
        const detalleActual = await prisma.detalle.findUnique({
        where: { id_detalle: idDetalle },
        include: { diametro: true, elemento: true },
        });
        if (!detalleActual) {
        throw new NotFoundException(`Detalle ${idDetalle} no encontrado`);
        }

        // 2) calcular parcial viejo
        const parcialViejo =
        (detalleActual.longitud_corte *
            detalleActual.cantidad_total *
            detalleActual.diametro.peso_por_metro) /
        1000;

        // 3) armar data + campos_modificados
        const { data, campos_modificados } = this.buildUpdateData(detalleActual, updateDetalleDto);

        // 4) actualizar detalle
        const detalleActualizado = await prisma.detalle.update({
        where: { id_detalle: idDetalle },
        data: { ...data, campos_modificados },
        include: { diametro: true, elemento: true },
        });

        // 5) calcular parcial nuevo
        const parcialNuevo =
        (detalleActualizado.longitud_corte *
            detalleActualizado.cantidad_total *
            detalleActualizado.diametro.peso_por_metro) /
        1000;

        // 6) ajustar planilla
        const planilla = await prisma.planilla.findUnique({
        where: { nro_planilla: detalleActualizado.elemento.nro_planilla },
        select: { peso_total: true, pesos_diametro: true },
        });
        if (!planilla) {
        throw new NotFoundException(`Planilla ${detalleActualizado.elemento.nro_planilla} no encontrada`);
        }

        const nuevoPesoTotal = planilla.peso_total + (parcialNuevo - parcialViejo);
        const pesosArray = this.updatePesosArray(
        planilla.pesos_diametro as any[],
        detalleActual,
        detalleActualizado,
        parcialViejo,
        parcialNuevo
        );

        // 7) Guardar cambios en la planilla
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

    // Incrementar revisión cuando se modifican detalles
    async updateDetallesBatch(nroPlanilla: string, updates: { idDetalle: number; updateDetalleDto: UpdateDetalleDto }[]) {
        return this.prisma.$transaction(async (prisma) => {
            try {
                for (const { idDetalle, updateDetalleDto } of updates) {
                    await this.updateDetalle(idDetalle, updateDetalleDto);
                }
                const planilla = await prisma.planilla.update({
                    where: { nro_planilla: nroPlanilla },
                    data: { revision: { increment: 1 } },
                });
                return planilla;
            } catch (err) {
                throw new BadRequestException('Error interno al actualizar detalles');
            }
        });
    }

    // Eliminar una planilla
    async deletePlanilla(nroPlanilla: string) {
        return await this.prisma.planilla.delete({
        where: { nro_planilla: nroPlanilla },
        });
    }
}
