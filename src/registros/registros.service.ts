import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { ProgresoService } from 'src/progreso/progreso.service';

@Injectable()
export class RegistrosService {
  constructor(private readonly prisma: PrismaService, private progresoService: ProgresoService) {}

  async createRegistro(createRegistroDto: CreateRegistroDto, idUsuario: number) {
    return this.prisma.$transaction(async (prisma) => {

      // Buscar al trabajador principal y al ayudante  
      const trabajador = await prisma.trabajador.findFirst({
        where: { nombre: createRegistroDto.nombreTrabajador },
      });

      if (!trabajador) {
        throw new NotFoundException(`Trabajador con nombre ${createRegistroDto.nombreTrabajador} no encontrado.`);
      }

      const ayudante = await prisma.trabajador.findFirst({
        where: { nombre: createRegistroDto.nombreAyudante },
      });
      if (!ayudante) {
        throw new NotFoundException(`Trabajador (ayudante) con nombre ${createRegistroDto.nombreAyudante} no encontrado.`);
      }

      // Buscar el detalle para obtener el diametro
      const detalleRecord = await prisma.detalle.findUnique({
        where: { id_detalle: createRegistroDto.idDetalle },
      });
      if (!detalleRecord) {
        throw new NotFoundException(`Detalle con id ${createRegistroDto.idDetalle} no encontrado.`);
      }

      // verificar si el detalle de tarea existe
      let detalleTarea = await prisma.detalle_tarea.findFirst({
        where: {
          id_detalle: createRegistroDto.idDetalle,
          id_tarea: createRegistroDto.idTarea,
        },
      });

      // Verificar que la cantidad acumulada no supere la cantidad total permitida
      const cantidadAcumuladaActual = detalleTarea ? detalleTarea.cantidad_acumulada : 0;
      if (cantidadAcumuladaActual + createRegistroDto.cantidad > detalleRecord.cantidad_total) {
        throw new BadRequestException(
          `La cantidad ingresada supera el total permitido. Cantidad actual acumulada: ${cantidadAcumuladaActual}, ` +
          `cantidad a agregar: ${createRegistroDto.cantidad}, cantidad total permitida: ${detalleRecord.cantidad_total}.`
        );
      }

      // Crear o actualizar el detalle de tarea
      if (!detalleTarea) {
        detalleTarea = await prisma.detalle_tarea.create({
          data: {
            id_detalle: createRegistroDto.idDetalle,
            id_tarea: createRegistroDto.idTarea,
            cantidad_acumulada: createRegistroDto.cantidad,
            completado: createRegistroDto.cantidad === detalleRecord.cantidad_total,
          },
        });
      } else {
        detalleTarea = await prisma.detalle_tarea.update({
          where: { id_detalle_tarea: detalleTarea.id_detalle_tarea },
          data: {
            cantidad_acumulada: { increment: createRegistroDto.cantidad },
            completado: cantidadAcumuladaActual + createRegistroDto.cantidad === detalleRecord.cantidad_total,
          },
        });
      }

      if (detalleTarea.completado) {
        await this.progresoService.actualizarProgresos(createRegistroDto.idDetalle);
      }

      // Obtener la fecha actual y el diametro
      const fecha = createRegistroDto.fecha || new Date();

      const diametroRecord = await prisma.diametro.findUnique({
        where: { medida_diametro: detalleRecord.medida_diametro },
      });
      if (!diametroRecord) {
        throw new NotFoundException(`Diametro con medida ${detalleRecord.medida_diametro} no encontrado.`);
      }

      // Calcular el peso parcial y los rendimientos
      const pesoParcial = createRegistroDto.cantidad * diametroRecord.peso_por_metro;
      const rendimientoTrabajador = pesoParcial > 0 ? createRegistroDto.horasTrabajador / pesoParcial : 0;
      const rendimientoAyudante = pesoParcial > 0 ? createRegistroDto.horasAyudante / pesoParcial : 0;
      
      // Crear registro
      const registro = await prisma.registro.create({
        data: {
          id_detalle_tarea: detalleTarea.id_detalle_tarea,
          fecha,
          cantidad: createRegistroDto.cantidad,
          horas_trabajador: createRegistroDto.horasTrabajador,
          horas_ayudante: createRegistroDto.horasAyudante,
          rendimiento_trabajador: rendimientoTrabajador,
          rendimiento_ayudante: rendimientoAyudante,
          id_usuario: idUsuario,                  
          id_trabajador: trabajador.id_trabajador,
          id_ayudante: ayudante.id_trabajador,       
        },
      });
      return registro;
    });
  }

  async updateRegistro(idRegistro: number, updateRegistroDto: UpdateRegistroDto) {
    return this.prisma.$transaction(async (prisma) => {
      // Buscar el registro existente.
      const registro = await prisma.registro.findUnique({
        where: { id_registro: idRegistro },
      });
      if (!registro) {
        throw new NotFoundException(`Registro con id ${idRegistro} no encontrado.`);
      }

      // Determinar los nuevos valores (si no se actualizan, se mantienen los actuales).
      const newCantidad = updateRegistroDto.cantidad ?? registro.cantidad;
      const newHorasTrabajador = updateRegistroDto.horasTrabajador ?? registro.horas_trabajador;
      const newHorasAyudante = updateRegistroDto.horasAyudante ?? registro.horas_ayudante;
     
      // Obtener el detalle de tarea asociado.
      let detalleTarea = await prisma.detalle_tarea.findUnique({
        where: { id_detalle_tarea: registro.id_detalle_tarea },
      });
      if (!detalleTarea) {
        throw new NotFoundException(`Detalle_tarea con id ${registro.id_detalle_tarea} no encontrado.`);
      }

      // Calcular el delta (la diferencia en cantidad).
      const deltaCantidad = newCantidad - registro.cantidad;

      // Obtener el registro de detalle para conocer cantidad_total y demás datos.
      const detalleRecord = await prisma.detalle.findUnique({
        where: { id_detalle: detalleTarea.id_detalle },
      });
      if (!detalleRecord) {
        throw new NotFoundException(`Detalle con id ${detalleTarea.id_detalle} no encontrado.`);
      }

      // Verificar que la suma de la cantidad acumulada y el delta no exceda cantidad_total.
      const newCantidadAcumulada = detalleTarea.cantidad_acumulada + deltaCantidad;
      if (newCantidadAcumulada > detalleRecord.cantidad_total) {
        throw new BadRequestException(
          `La cantidad acumulada resultante (${newCantidadAcumulada}) excede el total permitido (${detalleRecord.cantidad_total}).`
        );
      }

      // Actualizar la cantidad_acumulada en detalle_tarea (incrementar con el delta).
      detalleTarea = await prisma.detalle_tarea.update({
        where: { id_detalle_tarea: detalleTarea.id_detalle_tarea },
        data: {
          cantidad_acumulada: { increment: deltaCantidad },
          completado: newCantidadAcumulada === detalleRecord.cantidad_total,
        },
      });

      if (detalleTarea.completado) {
        await this.progresoService.actualizarProgresos(detalleTarea.id_detalle);
      }

      // Obtener el registro de diametro usando el campo medida_diametro del detalle.
      const diametroRecord = await prisma.diametro.findUnique({
        where: { medida_diametro: detalleRecord.medida_diametro },
      });
      if (!diametroRecord) {
        throw new NotFoundException(`Diametro con medida ${detalleRecord.medida_diametro} no encontrado.`);
      }

      // Recalcular el peso parcial y los rendimientos
      const pesoParcial = newCantidad * diametroRecord.peso_por_metro;
      const rendimientoTrabajador = pesoParcial > 0 ? newHorasTrabajador / pesoParcial : 0;
      const rendimientoAyudante = pesoParcial > 0 ? newHorasAyudante / pesoParcial : 0;

      // Determinar los nuevos IDs de trabajador y ayudante
      let newIdTrabajador = registro.id_trabajador;
      let newIdAyudante = registro.id_ayudante;

      if (updateRegistroDto.nombreTrabajador) {
        const trabajador = await prisma.trabajador.findFirst({
          where: { nombre: updateRegistroDto.nombreTrabajador },
        });
        if (!trabajador) {
          throw new NotFoundException(`Trabajador con nombre ${updateRegistroDto.nombreTrabajador} no encontrado.`);
        }
        newIdTrabajador = trabajador.id_trabajador;
      }

      if (updateRegistroDto.nombreAyudante) {
        const ayudante = await prisma.trabajador.findFirst({
          where: { nombre: updateRegistroDto.nombreAyudante },
        });
        if (!ayudante) {
          throw new NotFoundException(`Trabajador (ayudante) con nombre ${updateRegistroDto.nombreAyudante} no encontrado.`);
        }
        newIdAyudante = ayudante.id_trabajador;
      }

      // Actualizar el registro en la tabla "registro".
      const updatedRegistro = await prisma.registro.update({
        where: { id_registro: idRegistro },
        data: {
          cantidad: newCantidad,
          horas_trabajador: newHorasTrabajador,
          horas_ayudante: newHorasAyudante,
          rendimiento_trabajador: rendimientoTrabajador,
          rendimiento_ayudante: rendimientoAyudante,
          id_trabajador: newIdTrabajador,
          id_ayudante: newIdAyudante,
        },
      });
      return updatedRegistro;
    });
  }
}
