import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { ProgresoService } from '../progreso/progreso.service';

@Injectable()
export class RegistrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progresoService: ProgresoService,
  ) {}

  private calcularTiempoHoras(op: any): number {
    if (op.tiempoHoras && op.tiempoHoras > 0) return op.tiempoHoras;

    if (op.start && op.end) {
      const ini = new Date(op.start).getTime();
      const fin = new Date(op.end).getTime();
      if (isNaN(ini) || isNaN(fin) || fin <= ini) {
        throw new BadRequestException('Intervalo start/end inválido');
      }
      return (fin - ini) / 1000 / 3600;
    }

    throw new BadRequestException('Cada operador debe incluir tiempoHoras o start/end');
  }

  async createRegistro(dto: CreateRegistroDto, idUsuario: number) {
    const { registroCreado } = await this.prisma.$transaction(async (prisma) => {
      const detalleRecord = await prisma.detalle.findUnique({
        where: { id_detalle: dto.idDetalle },
        include: {
          elemento: { select: { nro_planilla: true } },
          diametro: true,
        },
      });
      if (!detalleRecord) {
        throw new NotFoundException(`Detalle con id ${dto.idDetalle} no encontrado.`);
      }

      const planilla = await prisma.planilla.findUnique({
        where: { nro_planilla: detalleRecord.elemento.nro_planilla },
        select: { peso_total: true },
      });
      if (!planilla || planilla.peso_total <= 0) {
        throw new BadRequestException('La planilla no tiene peso_total válido.');
      }

      let detalleTarea = await prisma.detalle_tarea.findFirst({
        where: { id_detalle: dto.idDetalle, id_tarea: dto.idTarea },
      });

      const acumuladoActual = detalleTarea?.cantidad_acumulada || 0;
      const nuevoAcumulado = acumuladoActual + dto.cantidad;

      if (nuevoAcumulado > detalleRecord.cantidad_total) {
        throw new BadRequestException(
          `La cantidad ingresada supera el total permitido (${detalleRecord.cantidad_total}).`,
        );
      }

      if (!detalleTarea) {
        detalleTarea = await prisma.detalle_tarea.create({
          data: {
            id_detalle: dto.idDetalle,
            id_tarea: dto.idTarea,
            cantidad_acumulada: nuevoAcumulado,
            completado: nuevoAcumulado >= detalleRecord.cantidad_total,
          },
        });
      } else {
        detalleTarea = await prisma.detalle_tarea.update({
          where: { id_detalle_tarea: detalleTarea.id_detalle_tarea },
          data: {
            cantidad_acumulada: nuevoAcumulado,
            completado: nuevoAcumulado >= detalleRecord.cantidad_total,
          },
        });
      }

      if (!dto.operadores || dto.operadores.length === 0) {
        throw new BadRequestException('Debe enviar al menos un operador.');
      }

      const operadoresNormalizados: {
        id_trabajador: number;
        tiempo_horas: number;
        slot: number;
      }[] = [];

      for (const op of dto.operadores) {
        const trabajador = await prisma.trabajador.findUnique({
          where: { id_trabajador: op.idTrabajador },
        });

        if (!trabajador) {
          throw new NotFoundException(`Trabajador con id ${op.idTrabajador} no encontrado.`);
        }

        const tiempo_horas = this.calcularTiempoHoras(op);

        operadoresNormalizados.push({
          id_trabajador: op.idTrabajador,
          tiempo_horas,
          slot: op.slot,
        });
      }

      const sumaTiempos = operadoresNormalizados.reduce((acc, o) => acc + o.tiempo_horas, 0);
      if (sumaTiempos <= 0) {
        throw new BadRequestException('La suma de tiempos de operadores debe ser > 0.');
      }

      const baseCantidad = dto.cantidad;

      const cantidades = operadoresNormalizados.map((o) =>
        Math.floor(baseCantidad * (o.tiempo_horas / sumaTiempos)),
      );

      const totalAsignado = cantidades.reduce((a, b) => a + b, 0);
      let resto = baseCantidad - totalAsignado;
      if (resto > 0 && cantidades.length > 0) {
        cantidades[0] += resto;
      }

      const registroCreado = await prisma.registro.create({
        data: {
          id_detalle_tarea: detalleTarea.id_detalle_tarea,
          fecha: new Date(),
          cantidad: dto.cantidad,
          id_usuario: idUsuario,
        },
      });

      // -----------------------------
      // Cálculo de ponderación por peso a nivel REGISTRO
      // -----------------------------
      const longitud = detalleRecord.longitud_corte;
      const pesoPorMetro = detalleRecord.diametro.peso_por_metro;

      // Peso de ESTE registro (cantidad del registro) en toneladas
      const pesoRegistroTon =
        (dto.cantidad * longitud * pesoPorMetro) / 1000;

      const pesoTotalTon = planilla.peso_total;
      if (pesoTotalTon <= 0) {
        throw new BadRequestException('peso_total de la planilla inválido.');
      }

      const coeficientePonderado = pesoRegistroTon / pesoTotalTon;

      for (let i = 0; i < operadoresNormalizados.length; i++) {
        const oper = operadoresNormalizados[i];
        const cant = cantidades[i];

        const pesoKg = cant * longitud * pesoPorMetro; // kg asignados a este operador
        const rendimiento_base = pesoKg > 0 ? oper.tiempo_horas / pesoKg : 0; // h/kg

        const rendimiento_final = rendimiento_base * coeficientePonderado;

        await prisma.registro_operador.create({
          data: {
            id_registro: registroCreado.id_registro,
            id_trabajador: oper.id_trabajador,
            tiempo_horas: oper.tiempo_horas,
            cantidad_unidades: cant,
            rendimiento: rendimiento_final,
            slot: oper.slot,
          },
        });
      }

      return { registroCreado };
    });

    await this.progresoService.actualizarProgresos(dto.idDetalle);

    return registroCreado;
  }
}
