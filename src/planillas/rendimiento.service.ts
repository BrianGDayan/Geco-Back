import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RendimientoService {
  private readonly logger = new Logger(RendimientoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async actualizarRendimientosGlobales() {
    try {
      this.logger.log('Iniciando actualización de rendimientos globales...');

      // Obtener todas las planillas que no están completas (progreso < 100)
      const planillas = await this.prisma.planilla.findMany({
        where: { progreso: { lt: 100 } },
        select: { nro_planilla: true },
      });

      // Iterar sobre cada planilla y actualizar sus rendimientos
      for (const planilla of planillas) {
        await this.actualizarRendimientosPlanilla(planilla.nro_planilla);
      }

      this.logger.log('Actualización completada');
    } catch (error) {
      this.logger.error('Error actualizando rendimientos:', error.stack);
      throw error;
    }
  }

  public async actualizarRendimientosPlanilla(nroPlanilla: string) {
    const tareas = [
      { tipo: 'corte', id: 1 },
      { tipo: 'doblado', id: 2 },
      { tipo: 'empaquetado', id: 3 },
    ];

    // Calcular promedio de rendimientos
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
          trabajador: aggregations._avg.rendimiento_trabajador || 0,
          ayudante: aggregations._avg.rendimiento_ayudante || 0,
        };
      })
    );

    const rendimientos = resultados.reduce((acc, curr) => ({
      ...acc,
      [`rendimiento_global_${curr.tipo}_trabajador`]: curr.trabajador,
      [`rendimiento_global_${curr.tipo}_ayudante`]: curr.ayudante,
    }), {});

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


    // Actualizar la planilla
    await this.prisma.planilla.update({
      where: { nro_planilla: nroPlanilla },
      data: {
        ...rendimientos,
        peso_total: pesoTotal,
        pesos_diametro,
      },
    });
  }

  async calcularRendimientosPorObra(obra: string) {
    if (obra === 'todas') {
      const resultado = await this.prisma.planilla.aggregate({
        _avg: {
          rendimiento_global_corte_trabajador: true,
          rendimiento_global_doblado_trabajador: true,
          rendimiento_global_empaquetado_trabajador: true,
          rendimiento_global_corte_ayudante: true,
          rendimiento_global_doblado_ayudante: true,
          rendimiento_global_empaquetado_ayudante: true,
        },
      });
      return resultado._avg;
    }

    const resultado = await this.prisma.planilla.groupBy({
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
    return resultado[0]?._avg || null;
  }
}
