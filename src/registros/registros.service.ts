import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistroDto } from './dto/create-registro.dto';
import { UpdateRegistroDto } from './dto/update-registro.dto';
import { ProgresoService } from 'src/progreso/progreso.service';
import { RendimientoService } from 'src/planillas/rendimiento.service';

@Injectable()
export class RegistrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progresoService: ProgresoService,
    private readonly rendimientoService: RendimientoService,
  ) {}

  async createRegistro(createRegistroDto: CreateRegistroDto, idUsuario: number) {
  const registro = await this.prisma.$transaction(async (prisma) => {
    // Buscar trabajador principal y ayudante
    const trabajador = await prisma.trabajador.findFirst({
      where: { nombre: createRegistroDto.nombreTrabajador }
    });
    if (!trabajador)
      throw new NotFoundException(`Trabajador con nombre ${createRegistroDto.nombreTrabajador} no encontrado.`);

    let ayudanteId: number | null = null;
    if (createRegistroDto.nombreAyudante) {
      const ayudante = await prisma.trabajador.findFirst({
        where: { nombre: createRegistroDto.nombreAyudante }
      });
      if (!ayudante)
        throw new NotFoundException(`Ayudante con nombre ${createRegistroDto.nombreAyudante} no encontrado.`);
      ayudanteId = ayudante.id_trabajador;
    }

    // Obtener detalle con nro_planilla
    const detalleRecord = await prisma.detalle.findUnique({
      where: { id_detalle: createRegistroDto.idDetalle },
      include: { elemento: { select: { nro_planilla: true } } }
    });
    if (!detalleRecord)
      throw new NotFoundException(`Detalle con id ${createRegistroDto.idDetalle} no encontrado.`);

    // Verificar acumulado
    let detalleTarea = await prisma.detalle_tarea.findFirst({
      where: { id_detalle: createRegistroDto.idDetalle, id_tarea: createRegistroDto.idTarea }
    });
    const acumuladoActual = detalleTarea?.cantidad_acumulada || 0;
    const nuevoAcumulado = acumuladoActual + createRegistroDto.cantidad;
    if (nuevoAcumulado > detalleRecord.cantidad_total) {
      throw new BadRequestException(`La cantidad ingresada supera el total permitido (${detalleRecord.cantidad_total}).`);
    }

    // Crear o actualizar detalle_tarea
    if (!detalleTarea) {
      detalleTarea = await prisma.detalle_tarea.create({
        data: {
          id_detalle: createRegistroDto.idDetalle,
          id_tarea: createRegistroDto.idTarea,
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

    // Calcular pesos y rendimientos unitarios
    const diametroRecord = await prisma.diametro.findUnique({
      where: { medida_diametro: detalleRecord.medida_diametro }
    });
    if (!diametroRecord)
      throw new NotFoundException(`Diametro ${detalleRecord.medida_diametro} no encontrado.`);

    const pesoParcial = createRegistroDto.cantidad * diametroRecord.peso_por_metro;
    const rendimientoTrabajador = pesoParcial > 0 ? createRegistroDto.horasTrabajador / pesoParcial : 0;
    const horasAyu = createRegistroDto.horasAyudante ?? 0;
    const rendimientoAyudante = pesoParcial > 0 ? horasAyu / pesoParcial : 0;

    // Crear registro de producción
    const registroCreado = await prisma.registro.create({
      data: {
        id_detalle_tarea: detalleTarea.id_detalle_tarea,
        fecha: new Date(),
        cantidad: createRegistroDto.cantidad,
        horas_trabajador: createRegistroDto.horasTrabajador,
        horas_ayudante: horasAyu,
        rendimiento_trabajador: rendimientoTrabajador,
        rendimiento_ayudante: rendimientoAyudante,
        id_usuario: idUsuario,
        id_trabajador: trabajador.id_trabajador,
        id_ayudante: ayudanteId,
      }
    });

    return {
      registroCreado,
      nroPlanilla: detalleRecord.elemento.nro_planilla,
    };
  });

  // Actualizar progreso global
  const progreso = await this.progresoService.actualizarProgresos(createRegistroDto.idDetalle);

  // Si la planilla está completa, recalcular rendimientos globales
  if (typeof progreso === 'number' && progreso >= 100) {
    await this.rendimientoService.actualizarRendimientosPlanilla(registro.nroPlanilla);
  }

  return registro.registroCreado;
}



  async updateRegistro(idRegistro: number, updateRegistroDto: UpdateRegistroDto) {
    return this.prisma.$transaction(async (prisma) => {
      const registro = await prisma.registro.findUnique({ where: { id_registro: idRegistro } });
      if (!registro) throw new NotFoundException(`Registro con id ${idRegistro} no encontrado.`);

      const newCantidad = updateRegistroDto.cantidad ?? registro.cantidad;
      const newHorasTrabajador = updateRegistroDto.horasTrabajador ?? registro.horas_trabajador;
      const newHorasAyudante = updateRegistroDto.horasAyudante ?? 0;

      const detalleTarea = await prisma.detalle_tarea.findUnique({ where: { id_detalle_tarea: registro.id_detalle_tarea } });
      if (!detalleTarea) throw new NotFoundException(`Detalle_tarea con id ${registro.id_detalle_tarea} no encontrado.`);

      const detalleRecord = await prisma.detalle.findUnique({ where: { id_detalle: detalleTarea.id_detalle } });
      if (!detalleRecord) throw new NotFoundException(`Detalle con id ${detalleTarea.id_detalle} no encontrado.`);

      const deltaCantidad = newCantidad - registro.cantidad;
      const acumuladoNuevo = detalleTarea.cantidad_acumulada + deltaCantidad;
      if (acumuladoNuevo > detalleRecord.cantidad_total) {
        throw new BadRequestException(`La cantidad acumulada resultante (${acumuladoNuevo}) excede el total permitido (${detalleRecord.cantidad_total}).`);
      }

      await prisma.detalle_tarea.update({
        where: { id_detalle_tarea: detalleTarea.id_detalle_tarea },
        data: {
          cantidad_acumulada: { increment: deltaCantidad },
          completado: acumuladoNuevo === detalleRecord.cantidad_total,
        }
      });

      // Calcular nuevo peso y rendimientos
      const diametroRecord = await prisma.diametro.findUnique({ where: { medida_diametro: detalleRecord.medida_diametro } });
      if (!diametroRecord) throw new NotFoundException(`Diametro con medida ${detalleRecord.medida_diametro} no encontrado.`);

      const pesoParcial = newCantidad * diametroRecord.peso_por_metro;
      const rendimientoTrabajador = pesoParcial > 0
        ? newHorasTrabajador / pesoParcial
        : 0;
      const rendimientoAyudante = pesoParcial > 0
        ? newHorasAyudante / pesoParcial
        : 0;

      let newIdTrabajador = registro.id_trabajador;
      if (updateRegistroDto.nombreTrabajador) {
        const trab = await prisma.trabajador.findFirst({ where: { nombre: updateRegistroDto.nombreTrabajador } });
        if (!trab) throw new NotFoundException(`Trabajador con nombre ${updateRegistroDto.nombreTrabajador} no encontrado.`);
        newIdTrabajador = trab.id_trabajador;
      }

      let newIdAyudante = registro.id_ayudante;
      if (updateRegistroDto.nombreAyudante) {
        const ayu = await prisma.trabajador.findFirst({ where: { nombre: updateRegistroDto.nombreAyudante } });
        if (!ayu) throw new NotFoundException(`Trabajador (ayudante) con nombre ${updateRegistroDto.nombreAyudante} no encontrado.`);
        newIdAyudante = ayu.id_trabajador;
      }

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

      // Recalcular solo esta planilla
      const detalleRec2 = await prisma.detalle.findUnique({
        where: { id_detalle: detalleTarea.id_detalle },
        include: { elemento: { select: { nro_planilla: true } } }
      });
      await this.rendimientoService.actualizarRendimientosPlanilla(
        detalleRec2!.elemento.nro_planilla
      );

      return updatedRegistro;
    });
  }
}
