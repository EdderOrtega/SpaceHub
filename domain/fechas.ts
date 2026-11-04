export function fechaLocal(fecha = new Date()): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}
export function manana(ahora = new Date()): string {
  const fecha = new Date(ahora);
  fecha.setDate(fecha.getDate() + 1);
  return fechaLocal(fecha);
}
export function fechaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const date = new Date(`${fecha}T12:00:00`);
  return !Number.isNaN(date.getTime()) && fechaLocal(date) === fecha;
}
export function inicioReserva(fecha: string, hora: number): Date {
  return new Date(`${fecha}T${String(hora).padStart(2, "0")}:00:00`);
}
export function fechaLarga(fecha: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));
}
export function horario(hora: number): string {
  return `${String(hora).padStart(2, "0")}:00 – ${String(hora + 1).padStart(2, "0")}:00`;
}
export const HORAS = Array.from({ length: 12 }, (_, index) => index + 8);
