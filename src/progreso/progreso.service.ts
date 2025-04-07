import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgresoService {
  constructor(private readonly prisma: PrismaService) {}

  async actualizarProgresos(idDetalle: number): Promise<void> {
    // Actualizar y obtener el nuevo progreso del detalle
    const tareasCompletadas = await this.prisma.detalle_tarea.count({
      where: {
        id_detalle: idDetalle,
        completado: true,
      },
    });
    const progresoDetalle = Math.round((tareasCompletadas / 3) * 100);
    
    await this.prisma.detalle.update({
      where: { id_detalle: idDetalle },
      data: { progreso: progresoDetalle },
    });
    
    // Si el detalle alcanza el 100%, actualizar el elemento y la planilla en cascada
    if (progresoDetalle === 100) {
      // Obtener el detalle con su elemento
      const detalle = await this.prisma.detalle.findUnique({
        where: { id_detalle: idDetalle },
        include: { elemento: true },
      });
      if (!detalle || !detalle.elemento) {
        throw new NotFoundException(`Detalle o elemento no encontrado para id_detalle: ${idDetalle}`);
      }
      
      // Actualizar el progreso del elemento:
      const elemento = await this.prisma.elemento.findUnique({
        where: { id_elemento: detalle.id_elemento },
        include: { detalle: true },
      });
      if (!elemento) {
        throw new NotFoundException(`Elemento con ID ${detalle.id_elemento} no encontrado`);
      }
      const totalDetalles = elemento.detalle.length;
      const progresoElemento = Math.round(elemento.detalle.reduce((sum, d) => sum + d.progreso, 0) / totalDetalles);

      await this.prisma.elemento.update({
        where: { id_elemento: elemento.id_elemento },
        data: { progreso: progresoElemento },
      });
      
      // Actualizar el progreso de la planilla:
      const planilla = await this.prisma.planilla.findUnique({
        where: { nro_planilla: detalle.elemento.nro_planilla },
        include: { elemento: true },
      });
      if (!planilla) {
        throw new NotFoundException(`Planilla con nro ${detalle.elemento.nro_planilla} no encontrada`);
      }
      const totalElementos = planilla.elemento.length;
      const progresoPlanilla = Math.round(planilla.elemento.reduce((sum, e) => sum + e.progreso, 0) / totalElementos);
      await this.prisma.planilla.update({
        where: { nro_planilla: planilla.nro_planilla },
        data: { progreso: progresoPlanilla },
      });
    }
  }
}
