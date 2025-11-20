import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { tareaAplicaATipo } from '../common/tareas.config';

@Injectable()
export class RendimientoService {
  private readonly logger = new Logger(RendimientoService.name);

  constructor(private readonly prisma: PrismaService) {}

  public async actualizarRendimientosPlanilla(nroPlanilla: string) {
    const planillaMeta = await this.prisma.planilla.findUnique({
      where: { nro_planilla: nroPlanilla },
      select: { progreso: true, peso_total: true },
    });
    if (!planillaMeta) {
      throw new NotFoundException(`Planilla ${nroPlanilla} no encontrada.`);
    }
    if (planillaMeta.peso_total <= 0) {
      return;
    }
    const pesoTotal = planillaMeta.peso_total;

    const tareas = [
      { tipo: 'corte', id: 1 },
      { tipo: 'doblado', id: 2 },
      { tipo: 'empaquetado', id: 3 },
    ];

    const detalles = await this.prisma.detalle.findMany({
      where: { elemento: { nro_planilla: nroPlanilla } },
      select: {
        id_detalle: true,
        tipo: true,
        longitud_corte: true,
        cantidad_total: true,
        diametro: { select: { peso_por_metro: true } },
      },
    });

    const rendimientos: Record<string, number> = {
      rendimiento_global_corte_trabajador: 0,
      rendimiento_global_corte_ayudante: 0,
      rendimiento_global_doblado_trabajador: 0,
      rendimiento_global_doblado_ayudante: 0,
      rendimiento_global_doblado_ayudante2: 0,
      rendimiento_global_empaquetado_trabajador: 0,
      rendimiento_global_empaquetado_ayudante: 0,
    };

    for (const { tipo, id } of tareas) {
      let sum = 0;

      for (const det of detalles) {
        if (!tareaAplicaATipo(det.tipo, id)) continue;

        const { longitud_corte, cantidad_total, diametro } = det;
        const pesoDetalleTon =
          (longitud_corte * cantidad_total * diametro.peso_por_metro) / 1000;

        if (pesoDetalleTon <= 0) continue;

        const coef = pesoDetalleTon / pesoTotal;

        const avg = await this.prisma.registro_operador.aggregate({
          where: {
            registro: {
              detalle_tarea: {
                id_detalle: det.id_detalle,
                id_tarea: id,
              },
            },
            rendimiento: { gt: 0 },
          },
          _avg: { rendimiento: true },
        });

        const r = avg._avg.rendimiento ?? 0;
        sum += r * coef;
      }

      switch (tipo) {
        case 'corte':
          rendimientos.rendimiento_global_corte_trabajador = sum;
          rendimientos.rendimiento_global_corte_ayudante = 0;
          break;
        case 'doblado':
          rendimientos.rendimiento_global_doblado_trabajador = sum;
          rendimientos.rendimiento_global_doblado_ayudante = 0;
          rendimientos.rendimiento_global_doblado_ayudante2 = 0;
          break;
        case 'empaquetado':
          rendimientos.rendimiento_global_empaquetado_trabajador = sum;
          rendimientos.rendimiento_global_empaquetado_ayudante = 0;
          break;
      }
    }

    await this.prisma.planilla.update({
      where: { nro_planilla: nroPlanilla },
      data: rendimientos,
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
      const avg = grouped[0]?._avg || {};

      return {
        rendimiento_global_corte_trabajador:
          avg.rendimiento_global_corte_trabajador ?? 0,
        rendimiento_global_doblado_trabajador:
          avg.rendimiento_global_doblado_trabajador ?? 0,
        rendimiento_global_empaquetado_trabajador:
          avg.rendimiento_global_empaquetado_trabajador ?? 0,
        rendimiento_global_corte_ayudante:
          avg.rendimiento_global_corte_ayudante ?? 0,
        rendimiento_global_doblado_ayudante:
          avg.rendimiento_global_doblado_ayudante ?? 0,
        rendimiento_global_doblado_ayudante2:
          avg.rendimiento_global_doblado_ayudante2 ?? 0,
        rendimiento_global_empaquetado_ayudante:
          avg.rendimiento_global_empaquetado_ayudante ?? 0,
      };
    }
  }
}
