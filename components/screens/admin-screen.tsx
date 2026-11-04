"use client";
import { useState } from "react";
import {
  Check,
  ChevronRight,
  DoorOpen,
  LockKeyhole,
  ShieldCheck,
  UnlockKeyhole,
} from "lucide-react";
import { buscarEspacio, CUENTAS, obtenerEspacios } from "@/data/demo";
import { fechaLarga, horario } from "@/domain/fechas";
import { TIPO_NOMBRE } from "@/domain/types";
import { Gate, Badge, Info, PageHeading, ReservationBadge } from "../ui";
import { useSpaceBook } from "../providers";
import { RoomIllustration } from "../map/building";

export function AdminScreen() {
  return (
    <Gate admin>
      <AdminContent />
    </Gate>
  );
}
function AdminContent() {
  const { store, datos } = useSpaceBook();
  const [selected, setSelected] = useState("estudio");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const espacio = buscarEspacio(selected)!;
  const blocked = datos!.bloqueados.includes(selected);
  const spaces = obtenerEspacios();
  const reservations = store.gestor
    .consultarReservas(true)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora - b.hora);
  const change = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await store.bloquear(selected, !blocked);
      setMessage(
        `${espacio.nombre}: ${blocked ? "espacio habilitado. Ya se puede consultar su disponibilidad." : "espacio bloqueado. No se admitirán nuevas reservaciones."}`,
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="content-page admin-page">
      <PageHeading
        eyebrow="CUIDAMOS EL ESPACIO ENTRE TODOS"
        title="Administración de espacios."
      >
        Gestiona la disponibilidad y consulta las reservaciones de Space Hub.
      </PageHeading>
      <div className="admin-role">
        <ShieldCheck size={16} />
        Sesión de administrador
        <span>Los cambios se reflejan inmediatamente en el mapa.</span>
      </div>
      {message && (
        <div className="success-message" role="status">
          <Check size={17} />
          {message}
        </div>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="admin-grid">
        <section className="admin-spaces">
          <div className="section-card-header">
            <h2>Espacios del edificio</h2>
            <span>10 espacios</span>
          </div>
          {[1, 2].map((piso) => (
            <div key={piso}>
              <h3 className="admin-floor-title">PISO {piso}</h3>
              {spaces
                .filter((s) => s.datos.piso === piso)
                .map((space) => (
                  <button
                    className={`admin-space-row ${selected === space.id ? "selected" : ""}`}
                    aria-pressed={selected === space.id}
                    key={space.id}
                    onClick={() => {
                      setSelected(space.id);
                      setMessage("");
                      setError("");
                    }}
                  >
                    <span className="admin-space-icon">
                      <DoorOpen size={18} />
                    </span>
                    <span>
                      <strong>{space.nombre}</strong>
                      <small>
                        {TIPO_NOMBRE[space.datos.tipo]} ·{" "}
                        {space.datos.capacidad} personas
                      </small>
                    </span>
                    <Badge
                      estado={
                        datos!.bloqueados.includes(space.id)
                          ? "bloqueado"
                          : space.datos.tipo === "privada"
                            ? "privado"
                            : "disponible"
                      }
                    />
                    <ChevronRight size={15} />
                  </button>
                ))}
            </div>
          ))}
        </section>
        <aside className="admin-selected">
          <RoomIllustration
            espacio={espacio}
            estado={blocked ? "bloqueado" : "disponible"}
          />
          <div className="admin-selected-body">
            <span className="eyebrow">
              PISO {espacio.datos.piso} · {TIPO_NOMBRE[espacio.datos.tipo]}
            </span>
            <h2>{espacio.nombre}</h2>
            <Badge
              estado={
                blocked
                  ? "bloqueado"
                  : espacio.datos.tipo === "privada"
                    ? "privado"
                    : "disponible"
              }
            />
            <p>{espacio.datos.descripcion}</p>
            <div className="admin-action-note">
              {blocked ? (
                <LockKeyhole size={22} />
              ) : (
                <UnlockKeyhole size={22} />
              )}
              <span>
                <strong>
                  {blocked
                    ? "Este espacio está bloqueado"
                    : "Este espacio está habilitado"}
                </strong>
                <small>
                  {blocked
                    ? "No permite nuevas reservaciones."
                    : espacio.reservable
                      ? "Disponible según la fecha y el horario."
                      : "Conserva su condición de espacio no reservable."}
                </small>
              </span>
            </div>
            <button
              className={`button full ${blocked ? "primary" : "warning"}`}
              onClick={change}
              disabled={busy}
            >
              {blocked ? (
                <UnlockKeyhole size={17} />
              ) : (
                <LockKeyhole size={17} />
              )}{" "}
              {busy
                ? "Guardando…"
                : blocked
                  ? "Habilitar espacio"
                  : "Bloquear espacio"}
            </button>
            <Info>
              El bloqueo impide nuevas reservas y conserva las ya registradas.
              Habilitar una oficina privada no la convierte en reservable.
            </Info>
          </div>
        </aside>
      </div>
      <section className="admin-bookings">
        <div className="section-card-header">
          <div>
            <span className="eyebrow">VISTA GENERAL</span>
            <h2>Reservaciones registradas</h2>
          </div>
          <span>{reservations.length} reservaciones</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Espacio</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reserva) => (
                <tr key={reserva.id}>
                  <td>
                    <strong>{buscarEspacio(reserva.espacioId)?.nombre}</strong>
                    <small>Folio {reserva.id.slice(0, 8).toUpperCase()}</small>
                  </td>
                  <td>
                    {CUENTAS.find((cuenta) => cuenta.id === reserva.usuarioId)
                      ?.nombre ?? "Usuario"}
                  </td>
                  <td>{fechaLarga(reserva.fecha)}</td>
                  <td>{horario(reserva.hora)}</td>
                  <td>
                    <ReservationBadge estado={reserva.estado} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reservations.length && (
            <div className="empty-state">
              <p>Aún no hay reservaciones registradas.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
