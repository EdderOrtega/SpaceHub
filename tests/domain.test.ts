import { test } from "node:test";
import assert from "node:assert/strict";
import { PISOS, buscarEspacio, CUENTAS, obtenerEspacios } from "../data/demo";
import { Espacio, Piso } from "../domain/composite";
import {
  Confirmada,
  Cancelada,
  Finalizada,
  Reservacion,
} from "../domain/reservacion";
import { fechaLocal, manana } from "../domain/fechas";
import type { DatosReserva } from "../domain/types";
import {
  DATOS_KEY,
  RepositorioLocal,
  type Almacenamiento,
} from "../persistence/repositorio";
import { Autenticacion } from "../services/autenticacion";
import { GestorReservaciones } from "../services/gestor-reservaciones";

class Memoria implements Almacenamiento {
  private datos = new Map<string, string>();
  getItem(key: string) {
    return this.datos.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.datos.set(key, value);
  }
  removeItem(key: string) {
    this.datos.delete(key);
  }
}
const now = new Date(2030, 0, 10, 7, 0, 0);
const fecha = manana(now);
function setup() {
  const storage = new Memoria();
  const repo = new RepositorioLocal(storage);
  repo.inicializar(now);
  const auth = new Autenticacion(storage);
  const gestor = new GestorReservaciones(repo, auth, () => now);
  return { storage, repo, auth, gestor };
}
function login(auth: Autenticacion, admin = false) {
  const cuenta = CUENTAS[admin ? 1 : 0];
  return auth.iniciarSesion(cuenta.email, cuenta.password);
}

test("RF-01: ambas cuentas inician sesión con su rol y cierran sesión", () => {
  const { auth } = setup();
  assert.equal(login(auth).rol, "usuario");
  auth.cerrarSesion();
  assert.equal(auth.usuarioActual(), null);
  assert.equal(login(auth, true).rol, "admin");
});
test("RF-01: credenciales incorrectas se rechazan sin crear una sesión", () => {
  const { auth } = setup();
  assert.throws(
    () => auth.iniciarSesion("usuario@spacehub.test", "mal"),
    /no son correctos/,
  );
  assert.equal(auth.usuarioActual(), null);
});
test("RF-02/03: Composite produce dos pisos, diez hojas y búsqueda real", () => {
  assert.equal(PISOS.length, 2);
  assert.equal(obtenerEspacios().length, 10);
  assert.ok(PISOS.every((piso) => piso instanceof Piso));
  assert.ok(obtenerEspacios().every((espacio) => espacio instanceof Espacio));
  assert.equal(PISOS[0].buscar("creativa")?.datos.piso, 1);
  assert.equal(PISOS[1].buscar("creativa"), undefined);
  const raiz = new Piso("hub", "Space Hub", 0)
    .agregar(PISOS[0])
    .agregar(PISOS[1]);
  assert.equal(raiz.obtenerEspacios().length, 10);
});
test("RF-04/05: un espacio disponible se reserva y ocupa solo ese bloque", async () => {
  const { auth, gestor } = setup();
  login(auth);
  assert.equal(gestor.disponibilidad("creativa", fecha, 10), "disponible");
  const reserva = await gestor.reservar("creativa", fecha, 10);
  assert.equal(reserva.estado, "confirmada");
  assert.equal(gestor.disponibilidad("creativa", fecha, 10), "ocupado");
  assert.equal(gestor.disponibilidad("creativa", fecha, 11), "disponible");
});
test("RF-05: se rechaza un duplicado incluso con otra cuenta", async () => {
  const { auth, gestor } = setup();
  login(auth);
  await gestor.reservar("creativa", fecha, 10);
  login(auth, true);
  await assert.rejects(
    gestor.reservar("creativa", fecha, 10),
    /ya no está disponible/,
  );
});
test("RF-05: dos intentos simultáneos solo confirman una reserva", async () => {
  const { auth, gestor } = setup();
  login(auth);
  const intentos = await Promise.allSettled([
    gestor.reservar("creativa", fecha, 10),
    gestor.reservar("creativa", fecha, 10),
  ]);
  assert.equal(
    intentos.filter((result) => result.status === "fulfilled").length,
    1,
  );
});
test("RF-05: dos salas diferentes pueden reservarse en el mismo horario", async () => {
  const { auth, gestor } = setup();
  login(auth);
  await gestor.reservar("creativa", fecha, 10);
  await gestor.reservar("sala-a", fecha, 10);
  assert.equal(gestor.disponibilidad("sala-a", fecha, 10), "ocupado");
});
test("RF-05: no permite oficinas privadas, área libre ni salas bloqueadas", async () => {
  const { auth, gestor } = setup();
  login(auth);
  await assert.rejects(gestor.reservar("oficina-1", fecha, 10), /no admite/);
  await assert.rejects(gestor.reservar("comun", fecha, 10), /no admite/);
  await assert.rejects(
    gestor.reservar("estudio", fecha, 10),
    /ya no está disponible/,
  );
});
test("RF-05: rechaza fechas inexistentes, pasadas y horas fuera de los bloques", async () => {
  const { auth, gestor } = setup();
  login(auth);
  await assert.rejects(
    gestor.reservar("creativa", "2030-02-30", 10),
    /fecha válida/,
  );
  await assert.rejects(
    gestor.reservar("creativa", "2020-01-01", 10),
    /ya comenzó/,
  );
  await assert.rejects(gestor.reservar("creativa", fecha, 10.5), /bloque/);
  await assert.rejects(gestor.reservar("creativa", fecha, 20), /bloque/);
});
test("RF-06: consulta propia y consulta administrativa separadas", () => {
  const { auth, gestor } = setup();
  login(auth);
  assert.ok(
    gestor.consultarReservas().every((reserva) => reserva.usuarioId === "ana"),
  );
  assert.throws(() => gestor.consultarReservas(true), /Solo el administrador/);
  login(auth, true);
  assert.equal(gestor.consultarReservas(true).length, 2);
});
test("RF-07: cancelar libera el horario y no admite doble cancelación", async () => {
  const { auth, gestor } = setup();
  login(auth);
  const reserva = await gestor.reservar("creativa", fecha, 10);
  await gestor.cancelar(reserva.id);
  assert.equal(gestor.disponibilidad("creativa", fecha, 10), "disponible");
  await assert.rejects(gestor.cancelar(reserva.id), /ya fue cancelada/);
  const nueva = await gestor.reservar("creativa", fecha, 10);
  assert.equal(nueva.estado, "confirmada");
});
test("RF-07: una cuenta no puede cancelar la reserva de otra cuenta", async () => {
  const { auth, gestor } = setup();
  login(auth);
  await assert.rejects(gestor.cancelar("demo-equipo"), /propias/);
  login(auth, true);
  await assert.rejects(gestor.cancelar("demo-ana"), /propias/);
});
test("RF-08: bloqueo y habilitación solo mediante administrador", async () => {
  const { auth, gestor } = setup();
  const user = login(auth);
  user.rol = "admin";
  await assert.rejects(
    gestor.establecerBloqueo("creativa", true),
    /Solo el administrador/,
  );
  assert.equal(gestor.disponibilidad("creativa", fecha, 10), "disponible");
  login(auth, true);
  await gestor.establecerBloqueo("creativa", true);
  assert.equal(gestor.disponibilidad("creativa", fecha, 10), "bloqueado");
  await assert.rejects(
    gestor.reservar("creativa", fecha, 10),
    /ya no está disponible/,
  );
  await gestor.establecerBloqueo("creativa", false);
  assert.equal(gestor.disponibilidad("creativa", fecha, 10), "disponible");
});
test("RF-08: bloquear conserva reservas previas y habilitar no cambia una oficina privada", async () => {
  const { auth, gestor, repo } = setup();
  login(auth, true);
  await gestor.establecerBloqueo("sala-b", true);
  assert.equal(
    repo.leer().reservas.find((r) => r.id === "demo-equipo")?.estado,
    "confirmada",
  );
  await gestor.establecerBloqueo("oficina-1", true);
  await gestor.establecerBloqueo("oficina-1", false);
  assert.equal(gestor.disponibilidad("oficina-1", fecha, 10), "privado");
});
test("Las operaciones de negocio sin sesión se rechazan", async () => {
  const { gestor } = setup();
  await assert.rejects(gestor.reservar("creativa", fecha, 10), /Inicia sesión/);
  await assert.rejects(
    gestor.establecerBloqueo("creativa", true),
    /Inicia sesión/,
  );
  await assert.rejects(gestor.cancelar("demo-ana"), /Inicia sesión/);
});
test("Persistencia: una nueva instancia recupera cuenta, reservas y bloqueos", async () => {
  const { auth, gestor, storage } = setup();
  login(auth, true);
  await gestor.establecerBloqueo("creativa", true);
  await gestor.reservar("sala-a", fecha, 11);
  const repo2 = new RepositorioLocal(storage);
  repo2.inicializar(new Date(2040, 1, 1));
  const auth2 = new Autenticacion(storage);
  const gestor2 = new GestorReservaciones(repo2, auth2, () => now);
  assert.equal(auth2.usuarioActual()?.rol, "admin");
  assert.equal(gestor2.disponibilidad("creativa", fecha, 10), "bloqueado");
  assert.equal(gestor2.disponibilidad("sala-a", fecha, 11), "ocupado");
});
test("State: Confirmada delega a Cancelada y Finalizada; terminales rechazan cancelar", () => {
  const dto: DatosReserva = {
    id: "state",
    espacioId: "creativa",
    usuarioId: "ana",
    fecha,
    hora: 10,
    estado: "confirmada",
    creadaEn: now.toISOString(),
  };
  const primera = Reservacion.recuperar(dto);
  assert.ok(primera.estado instanceof Confirmada);
  primera.cancelar();
  assert.ok(primera.estado instanceof Cancelada);
  assert.throws(() => primera.cancelar(), /ya fue cancelada/);
  const segunda = Reservacion.recuperar(JSON.parse(JSON.stringify(dto)));
  segunda.finalizar();
  assert.ok(segunda.estado instanceof Finalizada);
  assert.throws(() => segunda.cancelar(), /finalizada/);
  const recovered = Reservacion.recuperar(primera.serializar());
  assert.ok(recovered.estado instanceof Cancelada);
  assert.throws(() => recovered.finalizar(), /no puede finalizarse/);
});
test("State: el gestor finaliza automáticamente las reservas vencidas", async () => {
  const { auth, gestor, repo } = setup();
  login(auth);
  const reserva = await gestor.reservar("creativa", fecha, 10);
  const after = new GestorReservaciones(
    repo,
    auth,
    () => new Date(`${fecha}T11:01:00`),
  );
  await after.finalizarVencidas();
  assert.equal(
    repo.leer().reservas.find((r) => r.id === reserva.id)?.estado,
    "finalizada",
  );
  await assert.rejects(after.cancelar(reserva.id), /finalizada/);
});
test("Persistencia: datos corruptos no se sobrescriben de forma silenciosa", () => {
  const { repo, storage } = setup();
  storage.setItem(DATOS_KEY, "no-es-json");
  assert.throws(() => repo.leer(), /no se pueden leer/);
  assert.equal(storage.getItem(DATOS_KEY), "no-es-json");
});
test("Persistencia: un fallo de escritura no anuncia una confirmación", async () => {
  const { auth, repo } = setup();
  login(auth);
  repo.storage.setItem = () => {
    throw new Error("QuotaExceeded");
  };
  const gestor = new GestorReservaciones(repo, auth, () => now);
  await assert.rejects(
    gestor.reservar("creativa", fecha, 10),
    /No se pudieron guardar/,
  );
  assert.equal(gestor.disponibilidad("creativa", fecha, 10), "disponible");
});
test("Fechas locales y búsqueda mantienen los datos de la demostración", () => {
  assert.equal(fechaLocal(now), "2030-01-10");
  assert.equal(manana(new Date(2030, 0, 31)), "2030-02-01");
  assert.equal(buscarEspacio("no-existe"), undefined);
});
