import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { trabajador } from '@prisma/client';

@Injectable()
export class TrabajadoresService {
  private readonly logger = new Logger(TrabajadoresService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllActivos(): Promise<Pick<trabajador, 'id_trabajador' | 'nombre'>[]> {
    return this.prisma.trabajador.findMany({
      where: { activo: true },
      select: { id_trabajador: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async actualizarRendimientosSemanal() {
    const trabajadores = await this.prisma.trabajador.findMany({
      select: { id_trabajador: true },
      where: { activo: true },
    });

    for (const trab of trabajadores) {
      await this.calcularYActualizarRendimientos(trab.id_trabajador);
    }
  }

  private async calcularYActualizarRendimientos(idTrabajador: number) {
    try {
      const rendimientos = await this.prisma.$queryRaw<
        { id_tarea: number; promedio: number }[]
      >`
        SELECT 
          dt.id_tarea,
          AVG(ro.rendimiento) AS promedio
        FROM registro_operador ro
        JOIN registro r ON r.id_registro = ro.id_registro
        JOIN detalle_tarea dt ON dt.id_detalle_tarea = r.id_detalle_tarea
        WHERE ro.id_trabajador = ${idTrabajador}
          AND ro.rendimiento > 0
        GROUP BY dt.id_tarea
      `;

      const updates = {
        rendimiento_corte: 0,
        rendimiento_doblado: 0,
        rendimiento_empaquetado: 0,
      };

      rendimientos.forEach(({ id_tarea, promedio }) => {
        const val = parseFloat(String(promedio)) || 0;
        switch (id_tarea) {
          case 1:
            updates.rendimiento_corte = val;
            break;
          case 2:
            updates.rendimiento_doblado = val;
            break;
          case 3:
            updates.rendimiento_empaquetado = val;
            break;
        }
      });

      await this.prisma.trabajador.update({
        where: { id_trabajador: idTrabajador },
        data: updates,
      });

      this.logger.log(`Actualizado trabajador ID: ${idTrabajador}`);
    } catch (error: any) {
      this.logger.error(
        `Error actualizando trabajador ${idTrabajador}: ${error.message}`,
      );
    }
  }

  async obtenerRendimientosPorTarea(idTarea: number) {
    let campoRendimiento: keyof trabajador;
    switch (idTarea) {
      case 1:
        campoRendimiento = 'rendimiento_corte';
        break;
      case 2:
        campoRendimiento = 'rendimiento_doblado';
        break;
      case 3:
        campoRendimiento = 'rendimiento_empaquetado';
        break;
      default:
        throw new BadRequestException('Tarea inválida. Debe ser 1, 2 o 3.');
    }

    const selectObj: any = {
      id_trabajador: true,
      nombre: true,
      activo: true,
    };
    selectObj[campoRendimiento] = true;

    const trabajadores = await this.prisma.trabajador.findMany({
      where: { activo: true },
      select: selectObj,
      orderBy: { [campoRendimiento]: 'desc' },
    });

    return trabajadores;
  }
}
