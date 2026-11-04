"use client";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Coffee,
  Maximize,
  Monitor,
  Users,
  Wifi,
} from "lucide-react";
import type { Espacio } from "@/domain/composite";
import type { Disponibilidad } from "@/domain/types";
import { TIPO_NOMBRE } from "@/domain/types";
import {
  fechaLarga,
  horario,
  inicioReserva,
  fechaValida,
} from "@/domain/fechas";
import { Badge } from "./ui";
import { RoomIllustration } from "./map/building";
import { useSpaceBook } from "./providers";

export function Equipment({ name }: { name: string }) {
  const Icon = name === "Wi-Fi" ? Wifi : name === "Café" ? Coffee : Monitor;
  return (
    <span className="equipment-tag">
      <Icon size={14} />
      {name}
    </span>
  );
}
export function UnavailableReason({
  espacio,
  estado,
}: {
  espacio: Espacio;
  estado: Disponibilidad;
}) {
  if (estado === "bloqueado")
    return <>Temporalmente no disponible por mantenimiento o uso interno.</>;
  if (espacio.datos.tipo === "privada")
    return (
      <>Uso exclusivo de {espacio.datos.empresa}. No admite reservaciones.</>
    );
  if (espacio.datos.tipo === "comun")
    return <>Área de uso libre. No necesitas reservar.</>;
  if (estado === "ocupado")
    return <>Este bloque ya tiene una reserva. Prueba con otro horario.</>;
  return null;
}
export function SpacePanel({
  espacio,
  estado,
}: {
  espacio: Espacio;
  estado: Disponibilidad;
}) {
  const { seleccion } = useSpaceBook();
  const valid =
    fechaValida(seleccion.fecha) &&
    inicioReserva(seleccion.fecha, seleccion.hora) > new Date();
  const canBook = espacio.reservable && estado === "disponible" && valid;
  return (
    <aside
      className="space-panel"
      aria-label="Información del espacio seleccionado"
      aria-live="polite"
    >
      <div className="panel-art">
        <RoomIllustration espacio={espacio} estado={estado} />
        <span className="art-floor">PISO {espacio.datos.piso}</span>
        <span className="art-index">
          SPACE HUB / {espacio.id.toUpperCase()}
        </span>
      </div>
      <div className="space-panel-body">
        <div className="panel-type">{TIPO_NOMBRE[espacio.datos.tipo]}</div>
        <h2>{espacio.nombre}</h2>
        <Badge estado={estado} />
        <p className="space-description">{espacio.datos.descripcion}</p>
        <div className="space-facts">
          <div>
            <Users size={20} />
            <span>
              Capacidad<strong>{espacio.datos.capacidad} personas</strong>
            </span>
          </div>
          <div>
            <Maximize size={19} />
            <span>
              Superficie<strong>{espacio.datos.area} m²</strong>
            </span>
          </div>
        </div>
        <div className="equipment-section">
          <h3>Todo lo que necesitas</h3>
          <div className="equipment-tags">
            {espacio.datos.equipo.slice(0, 4).map((name) => (
              <Equipment key={name} name={name} />
            ))}
          </div>
        </div>
        <div className="selected-slot">
          <div>
            <CalendarDays size={18} />
            <span>
              {valid || fechaValida(seleccion.fecha)
                ? fechaLarga(seleccion.fecha)
                : "Elige una fecha"}
            </span>
          </div>
          <div>
            <Clock3 size={18} />
            <span>
              {horario(seleccion.hora)}
              <small>Bloque de 1 hora</small>
            </span>
          </div>
        </div>
        {(!espacio.reservable || estado !== "disponible") && (
          <p className="availability-reason">
            <UnavailableReason espacio={espacio} estado={estado} />
          </p>
        )}
        {!valid && espacio.reservable && estado === "disponible" && (
          <p className="availability-reason">
            Elige una fecha y un horario futuros.
          </p>
        )}
        <div className="panel-actions">
          {canBook ? (
            <Link
              href={`/reservar/${espacio.id}`}
              className="button primary full"
            >
              <CalendarDays size={18} />
              Reservar espacio
              <ArrowRight size={17} />
            </Link>
          ) : (
            <button className="button primary full" disabled>
              <CalendarDays size={18} />
              {espacio.reservable ? "No disponible" : "No reservable"}
            </button>
          )}
          <Link
            className="button secondary full"
            href={`/espacios/${espacio.id}`}
          >
            Ver detalles
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
