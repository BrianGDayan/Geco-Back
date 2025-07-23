import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RendimientoService } from 'src/planillas/rendimiento.service';

@Injectable()
export class ProgresoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rendimientoService: RendimientoService,
  ) {}

  async actualizarProgresos(idDetalle: number): Promise<number> {
    // Contar cuántas tareas están completadas para este detalle
    const tareasCompletadas = await this.prisma.detalle_tarea.count({
      where: { id_detalle: idDetalle, completado: true },
    });

    // Mapear número de tareas completadas a porcentaje fijo
    const mapProgreso: Record<number, number> = {
      0: 0,
      1: 33,
      2: 66,
      3: 100,
    };
    const progresoDetalle =
      tareasCompletadas >= 3 ? 100 : mapProgreso[tareasCompletadas] ?? 0;

    // Actualizar el detalle con el nuevo progreso
    await this.prisma.detalle.update({
      where: { id_detalle: idDetalle },
      data: { progreso: progresoDetalle },
    });

    if (progresoDetalle < 100) return progresoDetalle;

    // Traer detalle con su elemento
    const detalle = await this.prisma.detalle.findUnique({
      where: { id_detalle: idDetalle },
      include: { elemento: true },
    });
    if (!detalle || !detalle.elemento) {
      throw new NotFoundException(
        `Detalle o elemento no encontrado para id_detalle: ${idDetalle}`,
      );
    }

    // Calcular y actualizar progreso del elemento
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

    // Calcular progreso de la planilla
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

    if (progresoAnterior < 100 && progresoPlanilla >= 100) {
      await this.rendimientoService.actualizarRendimientosPlanilla(planilla.nro_planilla);
    }

    return progresoPlanilla;
  }
}
