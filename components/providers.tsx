"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { fechaValida, HORAS, manana } from "@/domain/fechas";
import { buscarEspacio } from "@/data/demo";
import type { DatosPersistidos, Seleccion, Usuario } from "@/domain/types";
import { RepositorioLocal, type Exclusor } from "@/persistence/repositorio";
import { Autenticacion } from "@/services/autenticacion";
import { GestorReservaciones } from "@/services/gestor-reservaciones";

interface Snapshot {
  listo: boolean;
  usuario: Usuario | null;
  datos: DatosPersistidos | null;
  error: string;
  seleccion: Seleccion;
}
const INITIAL: Snapshot = {
  listo: false,
  usuario: null,
  datos: null,
  error: "",
  seleccion: { fecha: "", hora: 10, piso: 1, espacioId: "creativa" },
};
const SELECCION_KEY = "spacebook:seleccion:v1";
function recuperarSeleccion(): Seleccion {
  const inicial = { ...INITIAL.seleccion, fecha: manana() };
  try {
    const valor = JSON.parse(
      window.localStorage.getItem(SELECCION_KEY) ?? "null",
    ) as Seleccion | null;
    const espacio = valor && buscarEspacio(valor.espacioId);
    if (
      valor &&
      espacio &&
      fechaValida(valor.fecha) &&
      HORAS.includes(valor.hora)
    )
      return { ...valor, piso: espacio.datos.piso };
  } catch {
    /* Una selección dañada se descarta; los datos de reservas se conservan. */
  }
  return inicial;
}
class Store {
  private state = INITIAL;
  private listeners = new Set<() => void>();
  private repo!: RepositorioLocal;
  auth!: Autenticacion;
  gestor!: GestorReservaciones;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.state;
  getServerSnapshot = () => INITIAL;
  private emit = (state: Snapshot) => {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  };
  iniciar = async () => {
    try {
      const exclusor: Exclusor = (trabajo) =>
        navigator.locks
          ? navigator.locks.request("spacebook:escritura", trabajo)
          : Promise.resolve(trabajo());
      this.repo = new RepositorioLocal(window.localStorage, exclusor);
      this.repo.inicializar(new Date());
      this.auth = new Autenticacion(window.localStorage);
      this.gestor = new GestorReservaciones(this.repo, this.auth);
      await this.gestor.finalizarVencidas();
      this.emit({
        ...this.state,
        listo: true,
        usuario: this.auth.usuarioActual(),
        datos: this.repo.leer(),
        seleccion: recuperarSeleccion(),
      });
    } catch (error) {
      this.emit({
        ...this.state,
        listo: true,
        error: (error as Error).message,
      });
    }
  };
  refrescar = () => {
    if (!this.repo) return;
    try {
      this.emit({
        ...this.state,
        usuario: this.auth.usuarioActual(),
        datos: this.repo.leer(),
        error: "",
      });
    } catch (error) {
      this.emit({ ...this.state, error: (error as Error).message });
    }
  };
  seleccionar = (seleccion: Partial<Seleccion>) => {
    const siguiente = { ...this.state.seleccion, ...seleccion };
    try {
      window.localStorage.setItem(SELECCION_KEY, JSON.stringify(siguiente));
      this.emit({ ...this.state, seleccion: siguiente });
    } catch {
      this.emit({
        ...this.state,
        error:
          "No se pudo guardar la selección. Habilita el almacenamiento local para continuar.",
      });
    }
  };
  login = (email: string, password: string) => {
    this.auth.iniciarSesion(email, password);
    this.refrescar();
  };
  logout = () => {
    this.auth.cerrarSesion();
    this.refrescar();
  };
  reservar = async (id: string, fecha: string, hora: number) => {
    const reserva = await this.gestor.reservar(id, fecha, hora);
    this.refrescar();
    return reserva;
  };
  cancelar = async (id: string) => {
    await this.gestor.cancelar(id);
    this.refrescar();
  };
  bloquear = async (id: string, bloquear: boolean) => {
    await this.gestor.establecerBloqueo(id, bloquear);
    this.refrescar();
  };
}
const Context = createContext<Store | null>(null);
export function Providers({ children }: { children: ReactNode }) {
  const [store] = useState(() => new Store());
  useEffect(() => {
    void store.iniciar();
    const refresh = () => store.refrescar();
    const tick = () => {
      if (store.gestor)
        void store.gestor.finalizarVencidas().then(refresh).catch(refresh);
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", tick);
    const timer = window.setInterval(tick, 60000);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", tick);
      clearInterval(timer);
    };
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useSpaceBook() {
  const store = useContext(Context);
  if (!store) throw new Error("Falta el proveedor de SpaceBook.");
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return { ...snapshot, store };
}
