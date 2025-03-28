import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrabajadoresService {
  private readonly logger = new Logger(TrabajadoresService.name);

  constructor(private readonly prisma: PrismaService) {}

  async actualizarRendimientosSemanal() {
    const trabajadores = await this.prisma.trabajador.findMany({
      select: { id_trabajador: true },
    });

    for (const trabajador of trabajadores) {
      await this.calcularYActualizarRendimientos(trabajador.id_trabajador);
    }
  }

  private async calcularYActualizarRendimientos(idTrabajador: number) {
    try {
      const rendimientos = await this.prisma.$queryRaw`
        SELECT 
          t.id_tarea,
          AVG(
            CASE 
              WHEN r.id_trabajador = ${idTrabajador} THEN r.rendimiento_trabajador
              WHEN r.id_ayudante = ${idTrabajador} THEN r.rendimiento_ayudante
            END
          ) as promedio
        FROM registro r
        JOIN detalle_tarea dt ON dt.id_detalle_tarea = r.id_detalle_tarea
        WHERE (r.id_trabajador = ${idTrabajador} OR r.id_ayudante = ${idTrabajador})
          AND r.fecha >= NOW() - INTERVAL '7 days'
        GROUP BY t.id_tarea
      `;

      const updates = {
        rendimiento_corte: 0,
        rendimiento_doblado: 0,
        rendimiento_empaquetado: 0,
      };

      (rendimientos as any[]).forEach(({ id_tarea, promedio }) => {
        switch (id_tarea) {
          case 1:
            updates.rendimiento_corte = parseFloat(promedio) || 0;
            break;
          case 2:
            updates.rendimiento_doblado = parseFloat(promedio) || 0;
            break;
          case 3:
            updates.rendimiento_empaquetado = parseFloat(promedio) || 0;
            break;
        }
      });

      await this.prisma.trabajador.update({
        where: { id_trabajador: idTrabajador },
        data: updates,
      });

      this.logger.log(`Actualizado trabajador ID: ${idTrabajador}`);
    } catch (error) {
      this.logger.error(`Error actualizando trabajador ${idTrabajador}: ${error.message}`);
    }
  }
}