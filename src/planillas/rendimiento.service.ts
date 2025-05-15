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
        select: { nro_planilla: true }
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

  private async actualizarRendimientosPlanilla(nroPlanilla: string) {
    const tareas = [
      { tipo: 'corte', id: 1 },
      { tipo: 'doblado', id: 2 },
      { tipo: 'empaquetado', id: 3 }
    ];

    // Obtener los registros de cada tarea y calcular el rendimiento promedio del trabajador y ayudante
    const resultados = await Promise.all(
      tareas.map(async ({ tipo, id }) => {
        const aggregations = await this.prisma.registro.aggregate({
          where: {
            detalle_tarea: {
              id_tarea: id,
              detalle: {
                elemento: { nro_planilla: nroPlanilla }
              }
            }
          },
          _avg: {
            rendimiento_trabajador: true,
            rendimiento_ayudante: true
          }
        });

        return {
          tipo,
          trabajador: aggregations._avg.rendimiento_trabajador || 0,
          ayudante: aggregations._avg.rendimiento_ayudante || 0
        };
      })
    );

    const rendimientos = resultados.reduce((acc, curr) => ({
      ...acc,
      [`rendimiento_global_${curr.tipo}_trabajador`]: curr.trabajador,
      [`rendimiento_global_${curr.tipo}_ayudante`]: curr.ayudante
    }), {});

    // Calcular el peso producido total y por diámetro
    const registros = await this.prisma.registro.findMany({
      where: {
        detalle_tarea: {
          detalle: {
            elemento: {
              nro_planilla: nroPlanilla
            }
          }
        }
      },
      select: {
        cantidad: true,
        detalle_tarea: {
          select: {
            detalle: {
              select: {
                medida_diametro: true,
                diametro: {
                  select: {
                    peso_por_metro: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const pesosPorDiametro: Record<number, number> = {};
    let pesoTotal = 0;

    for (const registro of registros) {
      const cantidad = registro.cantidad;
      const pesoMetro = registro.detalle_tarea.detalle.diametro.peso_por_metro;
      const diametro = registro.detalle_tarea.detalle.medida_diametro;
      const pesoParcial = cantidad * pesoMetro;

      pesoTotal += pesoParcial;
      pesosPorDiametro[diametro] = (pesosPorDiametro[diametro] || 0) + pesoParcial;
    }

    const pesos_diametro = Object.entries(pesosPorDiametro)
      .map(([diametro, peso]) => [Number(diametro), peso])
      .sort((a, b) => a[0] - b[0]);
    const peso_producido = pesoTotal;
    
    // Actualizar la planilla con los nuevos rendimientos
    await this.prisma.planilla.update({
      where: { nro_planilla: nroPlanilla },
      data: {
        ...rendimientos,
        peso_producido,
        pesos_diametro
      }
    });
  }

  async calcularRendimientosPorObra(obra: string) {
    const rendimientos = await this.prisma.planilla.groupBy({
      by: ['obra'],
      where: { obra },
      _avg: {
        rendimiento_global_corte_trabajador: true,
        rendimiento_global_doblado_trabajador: true,
        rendimiento_global_empaquetado_trabajador: true,
        rendimiento_global_corte_ayudante: true,
        rendimiento_global_doblado_ayudante: true,
        rendimiento_global_empaquetado_ayudante: true
      }
    });

    return rendimientos[0]?._avg || null;
  }
}