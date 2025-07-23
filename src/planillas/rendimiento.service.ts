import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RendimientoService {
  private readonly logger = new Logger(RendimientoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Calcular rendimientos globales de una planilla específica
  public async actualizarRendimientosPlanilla(nroPlanilla: string) {
    // Verificar existencia y obtener progreso y peso_total
    const planillaMeta = await this.prisma.planilla.findUnique({
      where: { nro_planilla: nroPlanilla },
      select: { progreso: true, peso_total: true },
    });
    if (!planillaMeta) {
      throw new NotFoundException(`Planilla ${nroPlanilla} no encontrada.`);
    }
    if (planillaMeta.peso_total <= 0) {
      // No hay peso para ponderar
      return;
    }
    const pesoTotal = planillaMeta.peso_total;

    const tareas = [
      { tipo: 'corte', id: 1 },
      { tipo: 'doblado', id: 2 },
      { tipo: 'empaquetado', id: 3 },
    ];

    const rendimientos: Record<string, number> = {};

    // Para cada tarea, calcular promedio ponderado
    for (const { tipo, id } of tareas) {
      // 1) Obtener detalles de la planilla
      const detalles = await this.prisma.detalle.findMany({
        where: { elemento: { nro_planilla: nroPlanilla } },
        select: {
          id_detalle: true,
          longitud_corte: true,
          cantidad_total: true,
          medida_diametro: true,
          diametro: { select: { peso_por_metro: true } },
        },
      });

      let sumTrab = 0;
      let sumAyu = 0;

      // 2) Calcular coeficiente y promedios parciales por detalle
      for (const det of detalles) {
        const { longitud_corte, cantidad_total, diametro: { peso_por_metro } } = det;
        // coeficiente de incidencia (toneladas del detalle / pesoTotal)
        const coef = (longitud_corte * cantidad_total * peso_por_metro / 1000) / pesoTotal;

        // promedio rendimiento trabajador para este detalle+tarea
        const avgT = await this.prisma.registro.aggregate({
          where: {
            detalle_tarea: { id_detalle: det.id_detalle, id_tarea: id },
            rendimiento_trabajador: { gt: 0 },
          },
          _avg: { rendimiento_trabajador: true },
        });
        // promedio rendimiento ayudante
        const avgA = await this.prisma.registro.aggregate({
          where: {
            detalle_tarea: { id_detalle: det.id_detalle, id_tarea: id },
            rendimiento_ayudante: { gt: 0 },
          },
          _avg: { rendimiento_ayudante: true },
        });

        const rT = avgT._avg.rendimiento_trabajador ?? 0;
        const rA = avgA._avg.rendimiento_ayudante ?? 0;

        sumTrab += rT * coef;
        sumAyu += rA * coef;
      }

      // Guardar resultado ponderado
      rendimientos[`rendimiento_global_${tipo}_trabajador`] = sumTrab;
      rendimientos[`rendimiento_global_${tipo}_ayudante`] = sumAyu;
    }

    // Persistir en la planilla
    await this.prisma.planilla.update({
      where: { nro_planilla: nroPlanilla },
      data: rendimientos,
    });
  }

  // Obtener rendimientos promedio por obra
  async calcularRendimientosPorObra(obra: string) {
    if (obra === 'todas') {
      // Calcular promedios de todas las planillas completadas
      const agregado = await this.prisma.planilla.aggregate({
        where: {
          progreso: 100,
        },
        _avg: {
          rendimiento_global_corte_trabajador: true,
          rendimiento_global_doblado_trabajador: true,
          rendimiento_global_empaquetado_trabajador: true,
          rendimiento_global_corte_ayudante: true,
          rendimiento_global_doblado_ayudante: true,
          rendimiento_global_empaquetado_ayudante: true,
        },
      });

      return {
        rendimiento_global_corte_trabajador: agregado._avg.rendimiento_global_corte_trabajador ?? 0,
        rendimiento_global_doblado_trabajador: agregado._avg.rendimiento_global_doblado_trabajador ?? 0,
        rendimiento_global_empaquetado_trabajador: agregado._avg.rendimiento_global_empaquetado_trabajador ?? 0,
        rendimiento_global_corte_ayudante: agregado._avg.rendimiento_global_corte_ayudante ?? 0,
        rendimiento_global_doblado_ayudante: agregado._avg.rendimiento_global_doblado_ayudante ?? 0,
        rendimiento_global_empaquetado_ayudante: agregado._avg.rendimiento_global_empaquetado_ayudante ?? 0,
      };
    } else {
      // Calcular promedios agrupando por obra específica
      const grouped = await this.prisma.planilla.groupBy({
        by: ['obra'],
        where: { obra, progreso: 100 },
        _avg: {
          rendimiento_global_corte_trabajador: true,
          rendimiento_global_doblado_trabajador: true,
          rendimiento_global_empaquetado_trabajador: true,
          rendimiento_global_corte_ayudante: true,
          rendimiento_global_doblado_ayudante: true,
          rendimiento_global_empaquetado_ayudante: true,
        },
      });
      const avg = grouped[0]?._avg || {};
      return {
        rendimiento_global_doblado_trabajador: avg.rendimiento_global_doblado_trabajador ?? 0,
        rendimiento_global_empaquetado_trabajador: avg.rendimiento_global_empaquetado_trabajador ?? 0,
        rendimiento_global_corte_ayudante: avg.rendimiento_global_corte_ayudante ?? 0,
        rendimiento_global_doblado_ayudante: avg.rendimiento_global_doblado_ayudante ?? 0,
        rendimiento_global_empaquetado_ayudante: avg.rendimiento_global_empaquetado_ayudante ?? 0,
        rendimiento_global_corte_trabajador: avg.rendimiento_global_corte_trabajador ?? 0,
      };
    }
  }
}
