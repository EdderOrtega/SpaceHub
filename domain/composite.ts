import type { DatosEspacio } from "./types";

/** Composite: mapa y UI consumen esta operación, tanto en pisos como en hojas. */
export interface ElementoMapa {
  readonly id: string;
  readonly nombre: string;
  obtenerEspacios(): Espacio[];
  buscar(id: string): Espacio | undefined;
}

export class Espacio implements ElementoMapa {
  constructor(public readonly datos: DatosEspacio) {}
  get id() {
    return this.datos.id;
  }
  get nombre() {
    return this.datos.nombre;
  }
  get reservable() {
    return this.datos.tipo !== "privada" && this.datos.tipo !== "comun";
  }
  obtenerEspacios(): Espacio[] {
    return [this];
  }
  buscar(id: string): Espacio | undefined {
    return this.id === id ? this : undefined;
  }
}

export class Piso implements ElementoMapa {
  private readonly elementos: ElementoMapa[] = [];
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly numero: number,
  ) {}
  agregar(elemento: ElementoMapa): this {
    this.elementos.push(elemento);
    return this;
  }
  obtenerEspacios(): Espacio[] {
    return this.elementos.flatMap((elemento) => elemento.obtenerEspacios());
  }
  buscar(id: string): Espacio | undefined {
    return this.obtenerEspacios().find((espacio) => espacio.id === id);
  }
}
