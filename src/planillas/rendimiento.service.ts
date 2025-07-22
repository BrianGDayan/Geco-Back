import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RendimientoService {
  private readonly logger = new Logger(RendimientoService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Calcular rendimientos globales y peso total de una planilla específica
  public async actualizarRendimientosPlanilla(nroPlanilla: string) {
  const planilla = await this.prisma.planilla.findUnique({
    where: { nro_planilla: nroPlanilla },
    select: { progreso: true },
  });

  if (!planilla) {
    throw new NotFoundException(`Planilla ${nroPlanilla} no encontrada.`);
  }

  if (planilla.progreso < 100) {
    // Si no está completa, no recalcular rendimientos ni pesos
    return;
  }

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
          rendimiento_trabajador: { gt: 0 },   
          rendimiento_ayudante: { gt: 0 },
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

  const rendimientos = resultados.reduce(
    (acc, curr) => ({
      ...acc,
      [`rendimiento_global_${curr.tipo}_trabajador`]: curr.trabajador,
      [`rendimiento_global_${curr.tipo}_ayudante`]: curr.ayudante,
    }),
    {}
  );

  // Calcular peso total y pesos por diámetro
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

  await this.prisma.planilla.update({
    where: { nro_planilla: nroPlanilla },
    data: {
      ...rendimientos,
      peso_total: pesoTotal,
      pesos_diametro,
    },
  });
  }

  // Obtener rendimientos promedio por obra
async calcularRendimientosPorObra(obra: string) {
  if (obra === 'todas') {
    // Calcular promedios de todas las planillas completadas
    const agregado = await this.prisma.planilla.aggregate({
      where: {
        progreso: 100,
        rendimiento_global_corte_trabajador: { gt: 0 },
        rendimiento_global_doblado_trabajador: { gt: 0 },
        rendimiento_global_empaquetado_trabajador: { gt: 0 },
        rendimiento_global_corte_ayudante: { gt: 0 },
        rendimiento_global_doblado_ayudante: { gt: 0 },
        rendimiento_global_empaquetado_ayudante: { gt: 0 },
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
