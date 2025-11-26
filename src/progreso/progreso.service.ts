import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RendimientoService } from '../planillas/rendimiento.service';

@Injectable()
export class ProgresoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rendimientoService: RendimientoService,
  ) {}

  async actualizarProgresos(idDetalle: number): Promise<number> {
    // 1) Obtener tipo del detalle (para saber qué tareas aplican)
    const detalleTipo = await this.prisma.detalle.findUnique({
      where: { id_detalle: idDetalle },
      select: { tipo: true },
    });

    if (!detalleTipo) {
      throw new NotFoundException(`Detalle ${idDetalle} no encontrado`);
    }

    const tipo = detalleTipo.tipo; // Int en la BD

    // 2) Definir qué tareas aplican según el tipo
    // Corte (1) siempre aplica
    const tareasAplicables: number[] = [1];

    // Doblado (2) no aplica en tipo 1
    if (tipo !== 1) {
      tareasAplicables.push(2);
    }

    // Empaquetado (3) no aplica en tipo 4
    if (tipo !== 4) {
      tareasAplicables.push(3);
    }

    const totalAplicables = tareasAplicables.length;

    // 3) Contar cuántas de las tareas aplicables están completadas
    const tareasCompletadas = await this.prisma.detalle_tarea.count({
      where: {
        id_detalle: idDetalle,
        id_tarea: { in: tareasAplicables },
        completado: true,
      },
    });

    // 4) Calcular progreso del detalle en función de tareas aplicables/completadas
    let progresoDetalle = 0;

    if (totalAplicables === 1) {
      // Caso extremo teórico (no debería ocurrir hoy, pero por seguridad)
      progresoDetalle = tareasCompletadas >= 1 ? 100 : 0;
    } else if (totalAplicables === 2) {
      // Tipos 1 y 4
      if (tareasCompletadas <= 0) progresoDetalle = 0;
      else if (tareasCompletadas === 1) progresoDetalle = 50;
      else progresoDetalle = 100; // 2/2
    } else if (totalAplicables === 3) {
      // Tipos 2 y 3
      if (tareasCompletadas <= 0) progresoDetalle = 0;
      else if (tareasCompletadas === 1) progresoDetalle = 33;
      else if (tareasCompletadas === 2) progresoDetalle = 66;
      else progresoDetalle = 100; // 3/3
    }

    // 5) Actualizar el detalle con el nuevo progreso
    await this.prisma.detalle.update({
      where: { id_detalle: idDetalle },
      data: { progreso: progresoDetalle },
    });

    // Si el detalle aún no está completo, no recalculamos elemento/planilla
    if (progresoDetalle < 100) return progresoDetalle;

    // 6) Traer detalle con su elemento
    const detalle = await this.prisma.detalle.findUnique({
      where: { id_detalle: idDetalle },
      include: { elemento: true },
    });
    if (!detalle || !detalle.elemento) {
      throw new NotFoundException(
        `Detalle o elemento no encontrado para id_detalle: ${idDetalle}`,
      );
    }

    // 7) Calcular y actualizar progreso del elemento
    const elemento = await this.prisma.elemento.findUnique({
      where: { id_elemento: detalle.elemento.id_elemento },
      include: { detalle: true },
    });
    if (!elemento) {
      throw new NotFoundException(
        `Elemento con ID ${detalle.elemento.id_elemento} no encontrado`,
      );
    }

    const sumaProgresoDetalles = elemento.detalle.reduce(
      (sum, d) => sum + d.progreso,
      0,
    );
    const progresoElemento = elemento.detalle.length
      ? Math.round(sumaProgresoDetalles / elemento.detalle.length)
      : 0;

    await this.prisma.elemento.update({
      where: { id_elemento: elemento.id_elemento },
      data: { progreso: progresoElemento },
    });

    // 8) Calcular progreso de la planilla
    const planilla = await this.prisma.planilla.findUnique({
      where: { nro_planilla: detalle.elemento.nro_planilla },
      include: { elemento: true },
    });
    if (!planilla) {
      throw new NotFoundException(
        `Planilla con nro ${detalle.elemento.nro_planilla} no encontrada`,
      );
    }

    const sumaProgresoElem = planilla.elemento.reduce(
      (sum, e) => sum + e.progreso,
      0,
    );
    const progresoPlanilla = planilla.elemento.length
      ? Math.round(sumaProgresoElem / planilla.elemento.length)
      : 0;

    const progresoAnterior = planilla.progreso;

    await this.prisma.planilla.update({
      where: { nro_planilla: planilla.nro_planilla },
      data: { progreso: progresoPlanilla },
    });

    // 9) Si la planilla pasó a 100%, recalcular rendimientos globales
    if (progresoAnterior < 100 && progresoPlanilla >= 100) {
      await this.rendimientoService.actualizarRendimientosPlanilla(
        planilla.nro_planilla,
      );
    }

    return progresoPlanilla;
  }
}
