"use client";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Layers,
  Maximize,
  Users,
} from "lucide-react";
import { buscarEspacio } from "@/data/demo";
import {
  fechaLarga,
  fechaValida,
  HORAS,
  inicioReserva,
  horario,
} from "@/domain/fechas";
import { TIPO_NOMBRE } from "@/domain/types";
import { Gate, Badge, BackLink, Info } from "../ui";
import { useSpaceBook } from "../providers";
import { RoomIllustration } from "../map/building";
import { BookingControls } from "../booking-controls";
import { Equipment, UnavailableReason } from "../space-panel";

export function DetailsScreen({ id }: { id: string }) {
  return (
    <Gate>
      <DetailsContent id={id} />
    </Gate>
  );
}
function DetailsContent({ id }: { id: string }) {
  const { seleccion, store, datos } = useSpaceBook();
  const espacio = buscarEspacio(id);
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
  return (
    <main className="content-page details-page">
      <BackLink />
      <div className="breadcrumb">
        Space Hub
        <ChevronRight size={13} />
        Piso {espacio.datos.piso}
        <ChevronRight size={13} />
        {espacio.nombre}
      </div>
      <div className="details-grid">
        <section>
          <div className="detail-hero">
            <RoomIllustration espacio={espacio} estado={estado} />
            <span className="detail-art-tag">
              <Layers size={14} />
              Piso {espacio.datos.piso} · Space Hub
            </span>
          </div>
          <div className="detail-copy">
            <span className="eyebrow">{TIPO_NOMBRE[espacio.datos.tipo]}</span>
            <div className="detail-title-row">
              <h1>{espacio.nombre}</h1>
              <Badge estado={estado} />
            </div>
            <p>{espacio.datos.descripcion}</p>
            <div className="detail-facts">
              <span>
                <Users size={22} />
                <strong>
                  {espacio.datos.capacidad} personas
                  <small>Capacidad del espacio</small>
                </strong>
              </span>
              <span>
                <Maximize size={21} />
                <strong>
                  {espacio.datos.area} m²<small>Espacio para tus ideas</small>
                </strong>
              </span>
              <span>
                <Layers size={21} />
                <strong>
                  Piso {espacio.datos.piso}
                  <small>Dentro de Space Hub</small>
                </strong>
              </span>
            </div>
            <h2>Un espacio listo para trabajar</h2>
            <div className="detail-equipment">
              {espacio.datos.equipo.map((name) => (
                <Equipment key={name} name={name} />
              ))}
            </div>
            <Info>
              {espacio.reservable ? (
                "Las reservas se realizan en bloques de una hora, de 08:00 a 20:00. Puedes cancelar antes de que comience tu horario."
              ) : (
                <UnavailableReason espacio={espacio} estado={estado} />
              )}
            </Info>
          </div>
        </section>
        <aside className="availability-card">
          <span className="eyebrow">PLANEAMOS CONTIGO</span>
          <h2>Hazlo tu espacio.</h2>
          <p>Elige cuándo quieres venir.</p>
          <BookingControls />
          <div className="availability-date">
            <CalendarDays size={17} />
            {fechaValida(seleccion.fecha)
              ? fechaLarga(seleccion.fecha)
              : "Elige una fecha válida"}
          </div>
          {espacio.reservable && (
            <>
              <h3>
                Horarios del día <span>1 hora cada uno</span>
              </h3>
              <div className="time-grid">
                {HORAS.map((hora) => {
                  const status = store.gestor.disponibilidad(
                    id,
                    seleccion.fecha,
                    hora,
                    datos!,
                  );
                  const past =
                    !fechaValida(seleccion.fecha) ||
                    inicioReserva(seleccion.fecha, hora) <= new Date();
                  const disabled = past || status !== "disponible";
                  return (
                    <button
                      key={hora}
                      aria-label={`${horario(hora)}, ${past ? "horario pasado" : status}`}
                      aria-pressed={hora === seleccion.hora}
                      className={hora === seleccion.hora ? "selected" : ""}
                      disabled={disabled}
                      onClick={() => store.seleccionar({ hora })}
                    >
                      <span>{String(hora).padStart(2, "0")}:00</span>
                      {disabled ? (
                        <small>
                          {past
                            ? "Pasado"
                            : status === "ocupado"
                              ? "Ocupado"
                              : "Bloqueado"}
                        </small>
                      ) : (
                        <Check size={12} />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="slot-summary">
            <Clock3 size={18} />
            <span>
              {horario(seleccion.hora)}
              <small>Tu horario seleccionado</small>
            </span>
            <Badge estado={estado} />
          </div>
          {available ? (
            <Link href={`/reservar/${id}`} className="button primary full">
              Reservar este espacio
              <ArrowRight size={17} />
            </Link>
          ) : (
            <>
              <button className="button primary full" disabled>
                {espacio.reservable
                  ? "Horario no disponible"
                  : "Espacio no reservable"}
              </button>
              <p className="availability-reason">
                <UnavailableReason espacio={espacio} estado={estado} />
                {!valid && espacio.reservable && estado === "disponible"
                  ? "Selecciona un horario futuro."
                  : ""}
              </p>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
