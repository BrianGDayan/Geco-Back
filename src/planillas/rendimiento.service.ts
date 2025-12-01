import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RendimientoService {
  private readonly logger = new Logger(RendimientoService.name);

  constructor(private readonly prisma: PrismaService) {}

  public async actualizarRendimientosPlanilla(nroPlanilla: string) {
    const planilla = await this.prisma.planilla.findUnique({
      where: { nro_planilla: nroPlanilla },
      select: { nro_planilla: true },
    });

    if (!planilla) {
      throw new NotFoundException(`Planilla ${nroPlanilla} no encontrada.`);
    }

    const operadores = await this.prisma.registro_operador.findMany({
      where: {
        rendimiento: { gt: 0 },
        registro: {
          detalle_tarea: {
            detalle: {
              elemento: { nro_planilla: nroPlanilla },
            },
          },
        },
      },
      select: {
        rendimiento: true,
        slot: true,
        registro: {
          select: {
            detalle_tarea: {
              select: { id_tarea: true },
            },
          },
        },
      },
    });

    type Acc = { sum: number; count: number };

    const acc: Record<string, Acc> = {
      corte_trab: { sum: 0, count: 0 },
      corte_ayud: { sum: 0, count: 0 },

      dobl_trab: { sum: 0, count: 0 },
      dobl_ayud: { sum: 0, count: 0 },
      dobl_ayud2: { sum: 0, count: 0 },

      emp_trab: { sum: 0, count: 0 },
      emp_ayud: { sum: 0, count: 0 },
    };

    for (const op of operadores) {
      const tareaId = op.registro.detalle_tarea.id_tarea;
      const slot = op.slot;
      const r = op.rendimiento;

      switch (tareaId) {
        case 1: // CORTE
          if (slot === 1) {
            acc.corte_trab.sum += r;
            acc.corte_trab.count++;
          } else if (slot === 2) {
            acc.corte_ayud.sum += r;
            acc.corte_ayud.count++;
          }
          break;
        case 2: // DOBLADO
          if (slot === 1) {
            acc.dobl_trab.sum += r;
            acc.dobl_trab.count++;
          } else if (slot === 2) {
            acc.dobl_ayud.sum += r;
            acc.dobl_ayud.count++;
          } else if (slot === 3) {
            acc.dobl_ayud2.sum += r;
            acc.dobl_ayud2.count++;
          }
          break;
        case 3: // EMPAQUETADO
          if (slot === 1) {
            acc.emp_trab.sum += r;
            acc.emp_trab.count++;
          } else if (slot === 2) {
            acc.emp_ayud.sum += r;
            acc.emp_ayud.count++;
          }
          break;
      }
    }

    const avg = (a: Acc) => (a.count > 0 ? a.sum / a.count : 0);

    await this.prisma.planilla.update({
      where: { nro_planilla: nroPlanilla },
      data: {
        rendimiento_global_corte_trabajador: avg(acc.corte_trab),
        rendimiento_global_corte_ayudante: avg(acc.corte_ayud),

        rendimiento_global_doblado_trabajador: avg(acc.dobl_trab),
        rendimiento_global_doblado_ayudante: avg(acc.dobl_ayud),
        rendimiento_global_doblado_ayudante2: avg(acc.dobl_ayud2),

        rendimiento_global_empaquetado_trabajador: avg(acc.emp_trab),
        rendimiento_global_empaquetado_ayudante: avg(acc.emp_ayud),
      },
    });
  }

  async calcularRendimientosPorObra(obra: string) {
    if (obra === 'todas') {
      const agregado = await this.prisma.planilla.aggregate({
        where: { progreso: 100 },
        _avg: {
          rendimiento_global_corte_trabajador: true,
          rendimiento_global_doblado_trabajador: true,
          rendimiento_global_empaquetado_trabajador: true,
          rendimiento_global_corte_ayudante: true,
          rendimiento_global_doblado_ayudante: true,
          rendimiento_global_doblado_ayudante2: true,
          rendimiento_global_empaquetado_ayudante: true,
        },
      });

      return {
        rendimiento_global_corte_trabajador:
          agregado._avg.rendimiento_global_corte_trabajador ?? 0,
        rendimiento_global_doblado_trabajador:
          agregado._avg.rendimiento_global_doblado_trabajador ?? 0,
        rendimiento_global_empaquetado_trabajador:
          agregado._avg.rendimiento_global_empaquetado_trabajador ?? 0,
        rendimiento_global_corte_ayudante:
          agregado._avg.rendimiento_global_corte_ayudante ?? 0,
        rendimiento_global_doblado_ayudante:
          agregado._avg.rendimiento_global_doblado_ayudante ?? 0,
        rendimiento_global_doblado_ayudante2:
          agregado._avg.rendimiento_global_doblado_ayudante2 ?? 0,
        rendimiento_global_empaquetado_ayudante:
          agregado._avg.rendimiento_global_empaquetado_ayudante ?? 0,
      };
    } else {
      const grouped = await this.prisma.planilla.groupBy({
        by: ['obra'],
        where: { obra, progreso: 100 },
        _avg: {
          rendimiento_global_corte_trabajador: true,
          rendimiento_global_doblado_trabajador: true,
          rendimiento_global_empaquetado_trabajador: true,
          rendimiento_global_corte_ayudante: true,
          rendimiento_global_doblado_ayudante: true,
          rendimiento_global_doblado_ayudante2: true,
          rendimiento_global_empaquetado_ayudante: true,
        },
      });
      const avgGroup = grouped[0]?._avg || {};

      return {
        rendimiento_global_corte_trabajador:
          avgGroup.rendimiento_global_corte_trabajador ?? 0,
        rendimiento_global_doblado_trabajador:
          avgGroup.rendimiento_global_doblado_trabajador ?? 0,
        rendimiento_global_empaquetado_trabajador:
          avgGroup.rendimiento_global_empaquetado_trabajador ?? 0,
        rendimiento_global_corte_ayudante:
          avgGroup.rendimiento_global_corte_ayudante ?? 0,
        rendimiento_global_doblado_ayudante:
          avgGroup.rendimiento_global_doblado_ayudante ?? 0,
        rendimiento_global_doblado_ayudante2:
          avgGroup.rendimiento_global_doblado_ayudante2 ?? 0,
        rendimiento_global_empaquetado_ayudante:
          avgGroup.rendimiento_global_empaquetado_ayudante ?? 0,
      };
    }
  }
}
