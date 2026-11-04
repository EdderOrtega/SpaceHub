export type Rol = "admin" | "usuario";
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}
export type TipoEspacio =
  | "juntas"
  | "estudio"
  | "privada"
  | "coworking"
  | "comun";
export type Disponibilidad = "disponible" | "ocupado" | "bloqueado" | "privado";
export interface DatosEspacio {
  id: string;
  nombre: string;
  piso: number;
  tipo: TipoEspacio;
  capacidad: number;
  descripcion: string;
  equipo: string[];
  area: number;
  empresa?: string;
  ubicacion: { x: number; y: number; ancho: number; fondo: number };
}
export type NombreEstado = "confirmada" | "cancelada" | "finalizada";
export interface DatosReserva {
  id: string;
  espacioId: string;
  usuarioId: string;
  fecha: string;
  hora: number;
  estado: NombreEstado;
  creadaEn: string;
}
export interface DatosPersistidos {
  version: 1;
  bloqueados: string[];
  reservas: DatosReserva[];
}
export interface Seleccion {
  fecha: string;
  hora: number;
  piso: number;
  espacioId: string;
}
export const TIPO_NOMBRE: Record<TipoEspacio, string> = {
  juntas: "Sala de juntas",
  estudio: "Estudio y capacitación",
  privada: "Oficina privada",
  coworking: "Coworking",
  comun: "Área común",
};
export const ESTADO_NOMBRE: Record<Disponibilidad, string> = {
  disponible: "Disponible",
  ocupado: "Ocupado",
  bloqueado: "Bloqueado",
  privado: "Oficina privada",
};
