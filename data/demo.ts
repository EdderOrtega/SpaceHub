import { Piso, Espacio } from "../domain/composite";
import { manana } from "../domain/fechas";
import type { DatosEspacio, DatosPersistidos, Usuario } from "../domain/types";

export const CUENTAS: (Usuario & { password: string })[] = [
  {
    id: "demo-user",
    nombre: "Usuario de demostración",
    email: "usuario@spacehub.test",
    rol: "usuario",
    password: "Usuario123!",
  },
  {
    id: "demo-admin",
    nombre: "Administrador de demostración",
    email: "admin@spacehub.test",
    rol: "admin",
    password: "Admin123!",
  },
];
const espacios: DatosEspacio[] = [
  {
    id: "sala-a",
    nombre: "Sala A",
    piso: 1,
    tipo: "juntas",
    capacidad: 6,
    area: 18,
    descripcion:
      "Un lugar tranquilo para conectar ideas. Reúne a tu equipo en una sala luminosa, cómoda y lista para trabajar.",
    equipo: ["Wi-Fi", "Pantalla", "Pizarrón", "Videollamadas"],
    ubicacion: { x: 0, y: 256, ancho: 154, fondo: 124 },
  },
  {
    id: "sala-b",
    nombre: "Sala B",
    piso: 1,
    tipo: "juntas",
    capacidad: 4,
    area: 16,
    descripcion:
      "Conversaciones que avanzan. Un espacio íntimo para entrevistas, asesorías y reuniones de equipos pequeños.",
    equipo: ["Wi-Fi", "Pantalla", "Pizarrón"],
    ubicacion: { x: 0, y: 128, ancho: 154, fondo: 122 },
  },
  {
    id: "estudio",
    nombre: "Sala de Estudio",
    piso: 1,
    tipo: "estudio",
    capacidad: 8,
    area: 22,
    descripcion:
      "Concéntrate en lo que importa. Mesas amplias y un ambiente tranquilo para estudiar, aprender o impartir un taller.",
    equipo: ["Wi-Fi", "Proyector", "Pizarrón", "Enchufes"],
    ubicacion: { x: 0, y: 0, ancho: 154, fondo: 122 },
  },
  {
    id: "coworking",
    nombre: "Coworking",
    piso: 1,
    tipo: "coworking",
    capacidad: 10,
    area: 32,
    descripcion:
      "Trabaja a tu ritmo, rodeado de buenas ideas. Reserva el área compartida para una sesión de trabajo colaborativo.",
    equipo: ["Wi-Fi", "Enchufes", "Café", "Escritorios"],
    ubicacion: { x: 166, y: 194, ancho: 174, fondo: 186 },
  },
  {
    id: "creativa",
    nombre: "Sala Creativa",
    piso: 1,
    tipo: "estudio",
    capacidad: 8,
    area: 28,
    descripcion:
      "Dale espacio a tu próxima gran idea. Un ambiente flexible para lluvia de ideas, talleres y trabajo en equipo.",
    equipo: ["Wi-Fi", "Pantalla", "Pizarrón", "Material creativo"],
    ubicacion: { x: 166, y: 0, ancho: 174, fondo: 186 },
  },
  {
    id: "oficina-1",
    nombre: "Oficina 1",
    piso: 2,
    tipo: "privada",
    capacidad: 4,
    area: 20,
    empresa: "Norte Studio",
    descripcion:
      "Oficina de uso exclusivo de Norte Studio. Este espacio tiene una asignación permanente y no admite reservaciones.",
    equipo: ["Wi-Fi", "Escritorios", "Almacenamiento"],
    ubicacion: { x: 0, y: 256, ancho: 154, fondo: 124 },
  },
  {
    id: "oficina-2",
    nombre: "Oficina 2",
    piso: 2,
    tipo: "privada",
    capacidad: 4,
    area: 20,
    empresa: "Estudio Verde",
    descripcion:
      "Oficina privada asignada a Estudio Verde. Un espacio de trabajo exclusivo para su equipo.",
    equipo: ["Wi-Fi", "Escritorios", "Almacenamiento"],
    ubicacion: { x: 0, y: 128, ancho: 154, fondo: 122 },
  },
  {
    id: "juntas",
    nombre: "Sala de Juntas",
    piso: 2,
    tipo: "juntas",
    capacidad: 10,
    area: 30,
    descripcion:
      "Las mejores decisiones empiezan con una buena conversación. Una sala amplia para presentaciones y reuniones de equipo.",
    equipo: ["Wi-Fi", "Pantalla", "Videollamadas", "Pizarrón"],
    ubicacion: { x: 0, y: 0, ancho: 154, fondo: 122 },
  },
  {
    id: "comun",
    nombre: "Área Común",
    piso: 2,
    tipo: "comun",
    capacidad: 12,
    area: 32,
    descripcion:
      "Haz una pausa, charla y recarga energía. Un área de uso libre para toda la comunidad; no requiere reservación.",
    equipo: ["Wi-Fi", "Café", "Sofás"],
    ubicacion: { x: 166, y: 194, ancho: 174, fondo: 186 },
  },
  {
    id: "capacitacion",
    nombre: "Capacitación",
    piso: 2,
    tipo: "estudio",
    capacidad: 12,
    area: 30,
    descripcion:
      "Aprender juntos se siente mejor. Una sala equipada para sesiones de capacitación, cursos y presentaciones.",
    equipo: ["Wi-Fi", "Proyector", "Pizarrón", "Enchufes"],
    ubicacion: { x: 166, y: 0, ancho: 174, fondo: 186 },
  },
];
export const PISOS = [1, 2].map((numero) => {
  const piso = new Piso(`piso-${numero}`, `Piso ${numero}`, numero);
  espacios
    .filter((espacio) => espacio.piso === numero)
    .forEach((datos) => piso.agregar(new Espacio(datos)));
  return piso;
});
export const obtenerEspacios = () =>
  PISOS.flatMap((piso) => piso.obtenerEspacios());
export const buscarEspacio = (id: string) =>
  PISOS.map((piso) => piso.buscar(id)).find(Boolean);
export function datosIniciales(ahora = new Date()): DatosPersistidos {
  const fecha = manana(ahora);
  return {
    version: 1,
    bloqueados: ["estudio"],
    reservas: [
      {
        id: "demo-equipo",
        espacioId: "sala-b",
        usuarioId: "demo-admin",
        fecha,
        hora: 10,
        estado: "confirmada",
        creadaEn: ahora.toISOString(),
      },
      {
        id: "demo-usuario",
        espacioId: "juntas",
        usuarioId: "demo-user",
        fecha,
        hora: 15,
        estado: "confirmada",
        creadaEn: ahora.toISOString(),
      },
    ],
  };
}
