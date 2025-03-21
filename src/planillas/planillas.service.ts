import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlanillaDto } from './dto/create-planilla.dto';
import { UpdatePlanillaDto } from './dto/update-planilla.dto';

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

}
