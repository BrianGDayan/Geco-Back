import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RendimientoService {
  private readonly logger = new Logger(RendimientoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Recalcular rendimientos globales de todas las planillas en progreso
  async actualizarRendimientosGlobales() {
    try {
      this.logger.log('Iniciando actualización de rendimientos globales...');

      // Buscar planillas en progreso
      const planillas = await this.prisma.planilla.findMany({
        where: { progreso: { lt: 100 } },
        select: { nro_planilla: true },
      });

      // Actualizar rendimientos planilla por planilla
      for (const planilla of planillas) {
        await this.actualizarRendimientosPlanilla(planilla.nro_planilla);
      }

      this.logger.log('Actualización completada');
    } catch (error) {
      this.logger.error('Error actualizando rendimientos:', error.stack);
      throw error;
    }
  }

  // Recalcular rendimientos globales y peso total de una planilla específica
  public async actualizarRendimientosPlanilla(nroPlanilla: string) {
    const tareas = [
      { tipo: 'corte', id: 1 },
      { tipo: 'doblado', id: 2 },
      { tipo: 'empaquetado', id: 3 },
    ];

    // Calcular promedios de rendimientos
    const resultados = await Promise.all(
      tareas.map(async ({ tipo, id }) => {
        const aggregations = await this.prisma.registro.aggregate({
          where: {
            detalle_tarea: {
              id_tarea: id,
              detalle: {
                elemento: { nro_planilla: nroPlanilla },
              },
            },
          },
          _avg: {
            rendimiento_trabajador: true,
            rendimiento_ayudante: true,
          },
        });

        return {
          tipo,
          trabajador: aggregations._avg.rendimiento_trabajador ?? 0,
          ayudante: aggregations._avg.rendimiento_ayudante ?? 0,
        };
      })
    );

    // Construir objeto de rendimientos para persistir
    const rendimientos = resultados.reduce(
      (acc, curr) => ({
        ...acc,
        [`rendimiento_global_${curr.tipo}_trabajador`]: curr.trabajador,
        [`rendimiento_global_${curr.tipo}_ayudante`]: curr.ayudante,
      }),
      {}
    );

    // Calcular peso total y pesos agrupados por diámetro
    const registros = await this.prisma.registro.findMany({
      where: {
        detalle_tarea: {
          detalle: {
            elemento: { nro_planilla: nroPlanilla },
          },
        },
      },
      select: {
        cantidad: true,
        detalle_tarea: {
          select: {
            detalle: {
              select: {
                medida_diametro: true,
                diametro: { select: { peso_por_metro: true } },
              },
            },
          },
        },
      },
    });

    const pesosPorDiametro: Record<number, number> = {};
    let pesoTotal = 0;

    for (const reg of registros) {
      const cantidad = reg.cantidad;
      const pesoMetro = reg.detalle_tarea.detalle.diametro.peso_por_metro;
      const diametro = reg.detalle_tarea.detalle.medida_diametro;
      const pesoParcial = cantidad * pesoMetro;
      pesoTotal += pesoParcial;
      pesosPorDiametro[diametro] = (pesosPorDiametro[diametro] || 0) + pesoParcial;
    }

    const pesos_diametro = Object.entries(pesosPorDiametro)
      .map(([d, p]) => ({ diametro: Number(d), peso: p }))
      .sort((a, b) => a.diametro - b.diametro);

    // Actualizar planilla con rendimientos y pesos calculados, asegurando evitar nulls
    await this.prisma.planilla.update({
      where: { nro_planilla: nroPlanilla },
      data: {
        ...rendimientos,
        peso_total: pesoTotal,
        pesos_diametro,
      },
    });
  }

  // Obtener rendimientos promedio por obra, recalculando si detecta nulls
  async calcularRendimientosPorObra(obra: string) {
    const hasNull = (avg: Record<string, number | null> | null) =>
      !avg || Object.values(avg).some((v) => v === null);

    let avgResult: Record<string, number | null> | null;

    if (obra === 'todas') {
      // Calcular promedios de todas las planillas
      const agregado = await this.prisma.planilla.aggregate({
        _avg: {
          rendimiento_global_corte_trabajador: true,
          rendimiento_global_doblado_trabajador: true,
          rendimiento_global_empaquetado_trabajador: true,
          rendimiento_global_corte_ayudante: true,
          rendimiento_global_doblado_ayudante: true,
          rendimiento_global_empaquetado_ayudante: true,
        },
      });
      avgResult = agregado._avg;

      if (hasNull(avgResult)) {
        // Recalcular rendimientos si se detectan valores nulos
        await this.actualizarRendimientosGlobales();
        const reAgregado = await this.prisma.planilla.aggregate({
          _avg: {
            rendimiento_global_corte_trabajador: true,
            rendimiento_global_doblado_trabajador: true,
            rendimiento_global_empaquetado_trabajador: true,
            rendimiento_global_corte_ayudante: true,
            rendimiento_global_doblado_ayudante: true,
            rendimiento_global_empaquetado_ayudante: true,
          },
        });
        avgResult = reAgregado._avg;
      }
    } else {
      // Calcular promedios agrupando por obra específica
      const grouped = await this.prisma.planilla.groupBy({
        by: ['obra'],
        where: { obra },
        _avg: {
          rendimiento_global_corte_trabajador: true,
          rendimiento_global_doblado_trabajador: true,
          rendimiento_global_empaquetado_trabajador: true,
          rendimiento_global_corte_ayudante: true,
          rendimiento_global_doblado_ayudante: true,
          rendimiento_global_empaquetado_ayudante: true,
        },
      });
      avgResult = grouped[0]?._avg || null;

      if (hasNull(avgResult)) {
        // Recalcular rendimientos de todas las planillas de esa obra
        const planillas = await this.prisma.planilla.findMany({
          where: { obra },
          select: { nro_planilla: true },
        });
        for (const { nro_planilla } of planillas) {
          await this.actualizarRendimientosPlanilla(nro_planilla);
        }
        const reGrouped = await this.prisma.planilla.groupBy({
          by: ['obra'],
          where: { obra },
          _avg: {
            rendimiento_global_corte_trabajador: true,
            rendimiento_global_doblado_trabajador: true,
            rendimiento_global_empaquetado_trabajador: true,
            rendimiento_global_corte_ayudante: true,
            rendimiento_global_doblado_ayudante: true,
            rendimiento_global_empaquetado_ayudante: true,
          },
        });
        avgResult = reGrouped[0]?._avg || null;
      }
    }

    // Retornar promedios asegurando valor cero si persisten nulos
    return {
      rendimiento_global_corte_trabajador: avgResult?.rendimiento_global_corte_trabajador ?? 0,
      rendimiento_global_doblado_trabajador: avgResult?.rendimiento_global_doblado_trabajador ?? 0,
      rendimiento_global_empaquetado_trabajador: avgResult?.rendimiento_global_empaquetado_trabajador ?? 0,
      rendimiento_global_corte_ayudante: avgResult?.rendimiento_global_corte_ayudante ?? 0,
      rendimiento_global_doblado_ayudante: avgResult?.rendimiento_global_doblado_ayudante ?? 0,
      rendimiento_global_empaquetado_ayudante: avgResult?.rendimiento_global_empaquetado_ayudante ?? 0,
    };
  }
}
