"use client";
import { CalendarDays, Clock3, Layers, Search } from "lucide-react";
import { fechaLocal, HORAS, horario } from "@/domain/fechas";
import { PISOS } from "@/data/demo";
import { useSpaceBook } from "./providers";

export function BookingControls({
  floors = false,
  search,
  onSearch,
}: {
  floors?: boolean;
  search?: string;
  onSearch?: (value: string) => void;
}) {
  const { seleccion, store } = useSpaceBook();
  return (
    <div className={`booking-controls ${floors ? "map-controls" : ""}`}>
      {floors && (
        <div className="floor-toggle" aria-label="Piso del edificio">
          {PISOS.map((piso) => (
            <button
              key={piso.id}
              className={seleccion.piso === piso.numero ? "active" : ""}
              aria-pressed={seleccion.piso === piso.numero}
              onClick={() =>
                store.seleccionar({
                  piso: piso.numero,
                  espacioId:
                    piso.obtenerEspacios().find((s) => s.reservable)?.id ??
                    "creativa",
                })
              }
            >
              <Layers size={16} />
              {piso.nombre}
            </button>
          ))}
        </div>
      )}
      <label className="field-inline">
        <CalendarDays size={18} />
        <span className="sr-only">Fecha de reservación</span>
        <input
          type="date"
          aria-label="Fecha de reservación"
          value={seleccion.fecha}
          min={fechaLocal()}
          onChange={(event) => store.seleccionar({ fecha: event.target.value })}
        />
      </label>
      <label className="field-inline">
        <Clock3 size={18} />
        <span className="sr-only">Horario de reservación</span>
        <select
          aria-label="Horario de reservación"
          value={seleccion.hora}
          onChange={(event) =>
            store.seleccionar({ hora: Number(event.target.value) })
          }
        >
          {HORAS.map((hora) => (
            <option key={hora} value={hora}>
              {horario(hora)}
            </option>
          ))}
        </select>
      </label>
      {onSearch && (
        <label className="field-inline search-field">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar sala o equipamiento…"
            aria-label="Buscar sala o equipamiento"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
          <span className="search-key">⌕</span>
        </label>
      )}
    </div>
  );
}
