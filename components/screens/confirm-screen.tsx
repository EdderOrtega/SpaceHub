"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";
import { buscarEspacio } from "@/data/demo";
import {
  fechaLarga,
  fechaValida,
  horario,
  inicioReserva,
} from "@/domain/fechas";
import type { DatosReserva } from "@/domain/types";
import { Gate, BackLink, Badge, Info } from "../ui";
import { useSpaceBook } from "../providers";
import { RoomIllustration } from "../map/building";
import { BookingControls } from "../booking-controls";
import { UnavailableReason } from "../space-panel";

export function ConfirmScreen({ id }: { id: string }) {
  return (
    <Gate>
      <ConfirmContent id={id} />
    </Gate>
  );
}
function ConfirmContent({ id }: { id: string }) {
  const { seleccion, store, datos, usuario } = useSpaceBook();
  const espacio = buscarEspacio(id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reserva, setReserva] = useState<DatosReserva | null>(null);
  if (!espacio)
    return (
      <main className="content-page">
        <BackLink />
        <h1>Este espacio no existe.</h1>
      </main>
    );
  const estado = store.gestor.disponibilidad(
    id,
    seleccion.fecha,
    seleccion.hora,
    datos!,
  );
  const valid =
    fechaValida(seleccion.fecha) &&
    inicioReserva(seleccion.fecha, seleccion.hora) > new Date();
  const available = espacio.reservable && estado === "disponible" && valid;
  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      setReserva(await store.reservar(id, seleccion.fecha, seleccion.hora));
    } catch (error) {
      store.refrescar();
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (reserva)
    return (
      <main className="content-page">
        <section className="success-card">
          <span className="success-icon">
            <CheckCircle2 size={38} />
          </span>
          <span className="eyebrow">TODO LISTO</span>
          <h1>Tu espacio te espera.</h1>
          <p>
            La reservación de <strong>{espacio.nombre}</strong> quedó
            confirmada.
          </p>
          <div className="success-slot">
            <span>
              <CalendarDays size={19} />
              {fechaLarga(reserva.fecha)}
            </span>
            <span>
              <Clock3 size={19} />
              {horario(reserva.hora)}
            </span>
          </div>
          <span className="reservation-code">
            Folio {reserva.id.slice(0, 8).toUpperCase()}
          </span>
          <Link href="/reservaciones" className="button primary">
            Ver mis reservaciones
            <ArrowRight size={17} />
          </Link>
          <Link href="/mapa" className="text-link">
            Seguir explorando Space Hub
          </Link>
        </section>
      </main>
    );
  return (
    <main className="content-page confirm-page">
      <BackLink href={`/espacios/${id}`}>Volver al espacio</BackLink>
      <div className="eyebrow">A UN PASO DE TU PRÓXIMA IDEA</div>
      <h1>Confirma tu reservación.</h1>
      <p className="page-intro">
        Revisa los detalles. Nosotros guardamos tu lugar.
      </p>
      <div className="confirm-grid">
        <section className="confirm-main">
          <div className="confirm-space">
            <RoomIllustration espacio={espacio} estado={estado} />
            <div>
              <span className="eyebrow">
                SPACE HUB · PISO {espacio.datos.piso}
              </span>
              <h2>{espacio.nombre}</h2>
              <Badge estado={estado} />
              <p>
                <Users size={16} />
                {espacio.datos.capacidad} personas<span>·</span>
                {espacio.datos.area} m²
              </p>
            </div>
          </div>
          <div className="confirm-section">
            <span className="section-step">01</span>
            <div>
              <h2>Elige tu momento</h2>
              <p>Un bloque de una hora, solo para tu equipo.</p>
              <BookingControls />
            </div>
          </div>
          <div className="confirm-section">
            <span className="section-step">02</span>
            <div>
              <h2>Reservación a nombre de</h2>
              <div className="booking-user">
                <span className="avatar">
                  {usuario?.nombre
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <span>
                  <strong>{usuario?.nombre}</strong>
                  <small>{usuario?.email}</small>
                </span>
                <Check size={17} />
              </div>
            </div>
          </div>
          <Info>
            Puedes cancelar desde Mis reservaciones antes del inicio del
            horario. Una reserva cancelada libera el espacio para la comunidad.
          </Info>
        </section>
        <aside className="booking-summary">
          <span className="eyebrow">TU PRÓXIMO ESPACIO</span>
          <h2>Resumen de reservación</h2>
          <div className="summary-space">
            <span className="summary-space-icon">
              <Layers size={23} />
            </span>
            <span>
              <strong>{espacio.nombre}</strong>
              <small>Space Hub · Piso {espacio.datos.piso}</small>
            </span>
          </div>
          <dl>
            <div>
              <dt>
                <CalendarDays size={17} />
                Fecha
              </dt>
              <dd>
                {fechaValida(seleccion.fecha)
                  ? fechaLarga(seleccion.fecha)
                  : "Fecha inválida"}
              </dd>
            </div>
            <div>
              <dt>
                <Clock3 size={17} />
                Horario
              </dt>
              <dd>{horario(seleccion.hora)}</dd>
            </div>
            <div>
              <dt>
                <Users size={17} />
                Capacidad
              </dt>
              <dd>{espacio.datos.capacidad} personas</dd>
            </div>
          </dl>
          <div className="summary-duration">
            <span>Duración total</span>
            <strong>1 hora</strong>
          </div>
          <div className="summary-note">
            <ShieldCheck size={18} />
            <p>Tu disponibilidad se vuelve a verificar al confirmar.</p>
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {!available && (
            <p className="form-error" role="status">
              <UnavailableReason espacio={espacio} estado={estado} />
              {!valid && espacio.reservable && estado === "disponible"
                ? "Selecciona una fecha y un horario futuros."
                : ""}
            </p>
          )}
          <button
            className="button primary full"
            disabled={busy || !available}
            onClick={confirm}
          >
            {busy ? "Confirmando…" : "Confirmar reservación"}
            {!busy && <ArrowRight size={17} />}
          </button>
          <Link href={`/espacios/${id}`} className="button secondary full">
            Regresar
          </Link>
        </aside>
      </div>
    </main>
  );
}
