import { datosIniciales, buscarEspacio } from "../data/demo";
import { fechaValida, HORAS } from "../domain/fechas";
import type { DatosPersistidos, DatosReserva } from "../domain/types";

export interface Almacenamiento {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const DATOS_KEY = "spacebook:datos:v1";
export const SESION_KEY = "spacebook:sesion:v1";
export type Exclusor = <T>(trabajo: () => T) => Promise<T>;
const sinBloqueo: Exclusor = async (trabajo) => trabajo();
function esReserva(valor: unknown): valor is DatosReserva {
  if (!valor || typeof valor !== "object") return false;
  const r = valor as DatosReserva;
  return (
    typeof r.id === "string" &&
    typeof r.usuarioId === "string" &&
    !!buscarEspacio(r.espacioId) &&
    fechaValida(r.fecha) &&
    HORAS.includes(r.hora) &&
    ["confirmada", "cancelada", "finalizada"].includes(r.estado) &&
    typeof r.creadaEn === "string"
  );
}
export class RepositorioLocal {
  constructor(
    public readonly storage: Almacenamiento,
    private readonly exclusor: Exclusor = sinBloqueo,
  ) {}
  inicializar(ahora: Date): void {
    if (this.storage.getItem(DATOS_KEY) === null)
      this.guardar(datosIniciales(ahora));
  }
  leer(): DatosPersistidos {
    const texto = this.storage.getItem(DATOS_KEY);
    try {
      const datos = JSON.parse(texto ?? "null") as DatosPersistidos;
      if (
        !datos ||
        datos.version !== 1 ||
        !Array.isArray(datos.reservas) ||
        !datos.reservas.every(esReserva) ||
        !Array.isArray(datos.bloqueados) ||
        !datos.bloqueados.every(
          (id) => typeof id === "string" && buscarEspacio(id),
        )
      )
        throw new Error();
      return datos;
    } catch {
      throw new Error(
        "Los datos locales no se pueden leer. Revisa el almacenamiento de este navegador antes de continuar.",
      );
    }
  }
  guardar(datos: DatosPersistidos): void {
    try {
      this.storage.setItem(DATOS_KEY, JSON.stringify(datos));
    } catch {
      throw new Error(
        "No se pudieron guardar los cambios. Habilita el almacenamiento local e inténtalo de nuevo.",
      );
    }
  }
  transaccion<T>(trabajo: (datos: DatosPersistidos) => T): Promise<T> {
    return this.exclusor(() => {
      const datos = this.leer();
      const resultado = trabajo(datos);
      this.guardar(datos);
      return resultado;
    });
  }
}
