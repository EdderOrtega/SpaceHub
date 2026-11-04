"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Layers,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { buscarEspacio } from "@/data/demo";
import { fechaLarga, horario, inicioReserva } from "@/domain/fechas";
import type { DatosReserva } from "@/domain/types";
import { Gate, Modal, PageHeading, ReservationBadge } from "../ui";
import { useSpaceBook } from "../providers";
import { RoomIllustration } from "../map/building";

export function ReservationsScreen() {
  return (
    <Gate>
      <ReservationsContent />
    </Gate>
  );
}
function ReservationsContent() {
  const { store, datos } = useSpaceBook();
  const [filter, setFilter] = useState("proximas");
  const [cancel, setCancel] = useState<DatosReserva | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // La consulta pasa por el gestor y solo entrega las reservas de la sesión actual.
  const all = datos ? store.gestor.consultarReservas() : [];
  const reservations = all
    .filter(
      (reserva) =>
        filter === "todas" ||
        (filter === "proximas"
          ? reserva.estado === "confirmada"
          : reserva.estado !== "confirmada"),
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora - b.hora);
  const doCancel = async () => {
    if (!cancel) return;
    setBusy(true);
    setError("");
    try {
      await store.cancelar(cancel.id);
      setCancel(null);
      setMessage(
        "Reservación cancelada. El horario ya está disponible de nuevo.",
      );
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="content-page reservations-page">
      <PageHeading
        eyebrow="TU AGENDA, EN UN SOLO LUGAR"
        title="Mis reservaciones."
      >
        Más enfoque, menos pendientes. Estos son tus próximos espacios.
      </PageHeading>
      <div className="reservations-toolbar">
        <div className="tab-list" aria-label="Filtrar reservaciones">
          {[
            {
              value: "proximas",
              label: "Próximas",
              count: all.filter((r) => r.estado === "confirmada").length,
            },
            {
              value: "historial",
              label: "Historial",
              count: all.filter((r) => r.estado !== "confirmada").length,
            },
            { value: "todas", label: "Todas", count: all.length },
          ].map((tab) => (
            <button
              key={tab.value}
              className={tab.value === filter ? "active" : ""}
              aria-pressed={tab.value === filter}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
              <span>{tab.count}</span>
            </button>
          ))}
        </div>
        <Link href="/mapa" className="button primary">
          <Plus size={17} />
          Nueva reservación
        </Link>
      </div>
      {message && (
        <div className="success-message" role="status">
          {message}
          <button
            aria-label="Cerrar mensaje"
            className="icon-button"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="reservations-list">
        {reservations.map((reserva) => {
          const espacio = buscarEspacio(reserva.espacioId)!;
          const canCancel =
            reserva.estado === "confirmada" &&
            inicioReserva(reserva.fecha, reserva.hora) > new Date();
          return (
            <article className="reservation-card" key={reserva.id}>
              <div className="reservation-art">
                <RoomIllustration espacio={espacio} />
              </div>
              <div className="reservation-info">
                <span className="reservation-location">
                  <MapPin size={13} />
                  Space Hub · Piso {espacio.datos.piso}
                </span>
                <h2>{espacio.nombre}</h2>
                <div className="reservation-metadata">
                  <span>
                    <CalendarDays size={16} />
                    {fechaLarga(reserva.fecha)}
                  </span>
                  <span>
                    <Clock3 size={16} />
                    {horario(reserva.hora)}
                  </span>
                  <span>
                    <Layers size={16} />1 hora
                  </span>
                </div>
                <span className="reservation-code">
                  Folio {reserva.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="reservation-actions">
                <ReservationBadge estado={reserva.estado} />
                <Link
                  href="/mapa"
                  className="text-link"
                  onClick={() =>
                    store.seleccionar({
                      espacioId: espacio.id,
                      piso: espacio.datos.piso,
                      fecha: reserva.fecha,
                      hora: reserva.hora,
                    })
                  }
                >
                  Ver en el mapa
                  <ArrowRight size={14} />
                </Link>
                {canCancel && (
                  <button
                    className="cancel-link"
                    onClick={() => {
                      setCancel(reserva);
                      setError("");
                    }}
                  >
                    Cancelar reservación
                  </button>
                )}
                {reserva.estado === "confirmada" && !canCancel && (
                  <small className="muted">El horario ya comenzó</small>
                )}
              </div>
            </article>
          );
        })}
        {!reservations.length && (
          <div className="empty-state">
            <CalendarDays size={38} />
            <h2>
              {filter === "proximas"
                ? "Tu próximo espacio está por descubrir."
                : "Todavía no hay reservaciones aquí."}
            </h2>
            <p>Explora el mapa y encuentra el lugar para tu siguiente idea.</p>
            <Link className="button primary" href="/mapa">
              Explorar espacios
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
      {cancel && (
        <Modal
          title="¿Cancelar esta reservación?"
          onClose={() => {
            if (!busy) setCancel(null);
          }}
        >
          <p>
            Vas a liberar{" "}
            <strong>{buscarEspacio(cancel.espacioId)?.nombre}</strong> para el{" "}
            {fechaLarga(cancel.fecha)}, de {horario(cancel.hora)}.
          </p>
          <p className="muted">
            La acción quedará en tu historial. Puedes reservar de nuevo si el
            horario sigue disponible.
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setCancel(null)}
            >
              Conservar reservación
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={doCancel}
            >
              {busy ? "Cancelando…" : "Sí, cancelar"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
