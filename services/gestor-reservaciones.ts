import { buscarEspacio } from "../data/demo";
import { fechaValida, HORAS, inicioReserva } from "../domain/fechas";
import { Reservacion } from "../domain/reservacion";
import type {
  DatosPersistidos,
  DatosReserva,
  Disponibilidad,
} from "../domain/types";
import { RepositorioLocal } from "../persistence/repositorio";
import { Autenticacion } from "./autenticacion";

export class GestorReservaciones {
  constructor(
    private readonly repo: RepositorioLocal,
    private readonly auth: Autenticacion,
    private readonly ahora = () => new Date(),
  ) {}
  disponibilidad(
    espacioId: string,
    fecha: string,
    hora: number,
    datos = this.repo.leer(),
  ): Disponibilidad {
    const espacio = buscarEspacio(espacioId);
    if (!espacio) throw new Error("El espacio no existe.");
    if (datos.bloqueados.includes(espacioId)) return "bloqueado";
    if (espacio.datos.tipo === "privada") return "privado";
    return datos.reservas.some(
      (reserva) =>
        reserva.espacioId === espacioId &&
        reserva.fecha === fecha &&
        reserva.hora === hora &&
        reserva.estado === "confirmada",
    )
      ? "ocupado"
      : "disponible";
  }
  reservar(
    espacioId: string,
    fecha: string,
    hora: number,
  ): Promise<DatosReserva> {
    return this.repo.transaccion((datos) => {
      const usuario = this.auth.requerirUsuario();
      const espacio = buscarEspacio(espacioId);
      if (!espacio) throw new Error("El espacio no existe.");
      if (!fechaValida(fecha) || !HORAS.includes(hora))
        throw new Error(
          "Elige una fecha válida y un bloque de una hora entre las 08:00 y las 20:00.",
        );
      if (inicioReserva(fecha, hora) <= this.ahora())
        throw new Error("No se puede reservar un horario que ya comenzó.");
      if (!espacio.reservable)
        throw new Error("Este espacio no admite reservaciones.");
      if (this.disponibilidad(espacioId, fecha, hora, datos) !== "disponible")
        throw new Error(
          "El espacio ya no está disponible en este horario. Elige otro bloque.",
        );
      const reserva: DatosReserva = {
        id: globalThis.crypto.randomUUID(),
        espacioId,
        usuarioId: usuario.id,
        fecha,
        hora,
        estado: "confirmada",
        creadaEn: this.ahora().toISOString(),
      };
      datos.reservas.push(reserva);
      return reserva;
    });
  }
  cancelar(id: string): Promise<void> {
    return this.repo.transaccion((datos) => {
      const usuario = this.auth.requerirUsuario();
      const indice = datos.reservas.findIndex((reserva) => reserva.id === id);
      if (indice < 0) throw new Error("La reservación no existe.");
      const dto = datos.reservas[indice];
      if (dto.usuarioId !== usuario.id)
        throw new Error("Solo puedes cancelar tus propias reservaciones.");
      if (
        dto.estado === "confirmada" &&
        inicioReserva(dto.fecha, dto.hora) <= this.ahora()
      )
        throw new Error(
          "Solo puedes cancelar antes del inicio de la reservación.",
        );
      const reserva = Reservacion.recuperar(dto);
      reserva.cancelar();
      datos.reservas[indice] = reserva.serializar();
    });
  }
  establecerBloqueo(espacioId: string, bloquear: boolean): Promise<void> {
    return this.repo.transaccion((datos) => {
      this.auth.requerirAdmin();
      if (!buscarEspacio(espacioId)) throw new Error("El espacio no existe.");
      datos.bloqueados = bloquear
        ? [...new Set([...datos.bloqueados, espacioId])]
        : datos.bloqueados.filter((id) => id !== espacioId);
    });
  }
  consultarReservas(todas = false): DatosReserva[] {
    const usuario = todas
      ? this.auth.requerirAdmin()
      : this.auth.requerirUsuario();
    return this.repo
      .leer()
      .reservas.filter((reserva) => todas || reserva.usuarioId === usuario.id);
  }
  finalizarVencidas(): Promise<void> {
    return this.repo.transaccion((datos: DatosPersistidos) => {
      for (let indice = 0; indice < datos.reservas.length; indice++) {
        const dto = datos.reservas[indice];
        if (
          dto.estado === "confirmada" &&
          inicioReserva(dto.fecha, dto.hora + 1) <= this.ahora()
        ) {
          const reserva = Reservacion.recuperar(dto);
          reserva.finalizar();
          datos.reservas[indice] = reserva.serializar();
        }
      }
    });
  }
}
