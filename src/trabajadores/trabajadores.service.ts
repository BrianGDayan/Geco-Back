import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrabajadoresService {
  private readonly logger = new Logger(TrabajadoresService.name);

  constructor(private readonly prisma: PrismaService) {}

  async actualizarRendimientosSemanal() {

    // Obtener todos los trabajadores activos
    const trabajadores = await this.prisma.trabajador.findMany({
      select: { id_trabajador: true },
      where: { activo: true },
    });

    // Iterar sobre cada trabajador y calcular sus rendimientos
    for (const trabajador of trabajadores) {
      await this.calcularYActualizarRendimientos(trabajador.id_trabajador);
    }
  }

  private async calcularYActualizarRendimientos(idTrabajador: number) {
    try {
      // Obtener los rendimientos del trabajador específico
      const rendimientos = await this.prisma.$queryRaw`
        SELECT 
          dt.id_tarea,
          AVG(
            CASE 
              WHEN r.id_trabajador = ${idTrabajador} THEN r.rendimiento_trabajador
              WHEN r.id_ayudante = ${idTrabajador} THEN r.rendimiento_ayudante
            END
          ) as promedio
        FROM registro r
        JOIN detalle_tarea dt ON dt.id_detalle_tarea = r.id_detalle_tarea
        WHERE (r.id_trabajador = ${idTrabajador} OR r.id_ayudante = ${idTrabajador})
        GROUP BY dt.id_tarea
`;
      
      const updates = {
        rendimiento_corte: 0,
        rendimiento_doblado: 0,
        rendimiento_empaquetado: 0,
      };
      
      // Iterar sobre los rendimientos obtenidos y asignarlos a los campos correspondientes.
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

      // Actualizar el trabajador con los nuevos rendimientos calculados.
      await this.prisma.trabajador.update({
        where: { id_trabajador: idTrabajador },
        data: updates,
      });

      this.logger.log(`Actualizado trabajador ID: ${idTrabajador}`);
    } catch (error) {
      this.logger.error(`Error actualizando trabajador ${idTrabajador}: ${error.message}`);
    }
  }

  async obtenerRendimientosPorTarea(idTarea: number) {
    // Determinar el campo de rendimiento según el id de la tarea.
    let campoRendimiento: string;
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

    // Crear un objeto select dinámico para incluir el campo de rendimiento determinado.
    const selectObj: any = {
      id_trabajador: true,
      nombre: true,
      activo: true,
    };
    selectObj[campoRendimiento] = true;

    // Consultar todos los trabajadores activos, retornando el campo de rendimiento específico.
    const trabajadores = await this.prisma.trabajador.findMany({
      where: { activo: true },
      select: selectObj,
    });

    return trabajadores;
  }
}