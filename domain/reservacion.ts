import type { DatosReserva, NombreEstado } from "./types";

export interface EstadoReserva {
  readonly nombre: NombreEstado;
  cancelar(reserva: Reservacion): void;
  finalizar(reserva: Reservacion): void;
}
export class Confirmada implements EstadoReserva {
  readonly nombre = "confirmada" as const;
  cancelar(reserva: Reservacion) {
    reserva.cambiarEstado(new Cancelada());
  }
  finalizar(reserva: Reservacion) {
    reserva.cambiarEstado(new Finalizada());
  }
}
export class Cancelada implements EstadoReserva {
  readonly nombre = "cancelada" as const;
  cancelar(): never {
    throw new Error("Esta reservación ya fue cancelada.");
  }
  finalizar(): never {
    throw new Error("Una reservación cancelada no puede finalizarse.");
  }
}
export class Finalizada implements EstadoReserva {
  readonly nombre = "finalizada" as const;
  cancelar(): never {
    throw new Error("Una reservación finalizada no puede cancelarse.");
  }
  finalizar(): never {
    throw new Error("Esta reservación ya finalizó.");
  }
}
const ESTADOS: Record<NombreEstado, () => EstadoReserva> = {
  confirmada: () => new Confirmada(),
  cancelada: () => new Cancelada(),
  finalizada: () => new Finalizada(),
};

/** State: las transiciones se delegan a objetos de estado reconstruidos al leer JSON. */
export class Reservacion {
  private estadoActual: EstadoReserva;
  constructor(private readonly datos: DatosReserva) {
    this.estadoActual = ESTADOS[datos.estado]();
  }
  get estado(): EstadoReserva {
    return this.estadoActual;
  }
  cambiarEstado(estado: EstadoReserva): void {
    this.estadoActual = estado;
  }
  cancelar(): void {
    this.estadoActual.cancelar(this);
  }
  finalizar(): void {
    this.estadoActual.finalizar(this);
  }
  serializar(): DatosReserva {
    return { ...this.datos, estado: this.estadoActual.nombre };
  }
  static recuperar(datos: DatosReserva): Reservacion {
    return new Reservacion(datos);
  }
}
