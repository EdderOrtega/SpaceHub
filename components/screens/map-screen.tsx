"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  LockKeyhole,
  MapPin,
  Users,
} from "lucide-react";
import { buscarEspacio, PISOS } from "@/data/demo";
import type { Disponibilidad } from "@/domain/types";
import { Building } from "../map/building";
import { useSpaceBook } from "../providers";
import { Gate, PageHeading } from "../ui";
import { BookingControls } from "../booking-controls";
import { HubIllustration } from "../hub-illustration";
import { SpacePanel } from "../space-panel";

export function MapScreen() {
  return (
    <Gate>
      <MapContent />
    </Gate>
  );
}
function MapContent() {
  const { seleccion, store, datos } = useSpaceBook();
  const [search, setSearch] = useState("");
  const espacio = buscarEspacio(seleccion.espacioId)!;
  const estado = (id: string): Disponibilidad =>
    store.gestor.disponibilidad(id, seleccion.fecha, seleccion.hora, datos!);
  const spaces = PISOS.find(
    (piso) => piso.numero === seleccion.piso,
  )!.obtenerEspacios();
  const available = spaces.filter(
    (space) => space.reservable && estado(space.id) === "disponible",
  ).length;
  const matching = spaces.filter((space) =>
    `${space.nombre} ${space.datos.equipo.join(" ")}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <main className="map-page">
      <PageHeading
        eyebrow="TU ESPACIO, A TU RITMO"
        title="Encuentra tu próximo espacio."
      >
        Explora Space Hub, elige tu lugar y deja que las ideas fluyan.
      </PageHeading>
      <BookingControls floors search={search} onSearch={setSearch} />
      <div className="map-layout">
        <aside className="building-sidebar">
          <div className="hub-card">
            <HubIllustration />
            <div className="hub-card-body">
              <div className="eyebrow">BIENVENIDO A</div>
              <h2>
                Space Hub<span>↗</span>
              </h2>
              <p>
                Un lugar para trabajar.
                <br />
                Mil posibilidades para crear.
              </p>
              <span className="hub-location">
                <MapPin size={13} />
                Tu comunidad de trabajo
              </span>
            </div>
          </div>
          <div className="legend">
            <h3>Cada espacio, un estado</h3>
            {[
              {
                key: "disponible",
                title: "Disponible",
                copy: "Listo para reservar",
                icon: Check,
              },
              {
                key: "ocupado",
                title: "Ocupado",
                copy: "Prueba otro horario",
                icon: Users,
              },
              {
                key: "bloqueado",
                title: "Bloqueado",
                copy: "Temporalmente no disponible",
                icon: LockKeyhole,
              },
              {
                key: "privado",
                title: "Oficina privada",
                copy: "Asignada a una empresa",
                icon: LockKeyhole,
              },
            ].map(({ key, title, copy, icon: Icon }) => (
              <div className={`legend-item ${key}`} key={key}>
                <span className="legend-swatch">
                  <Icon size={13} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{copy}</small>
                </span>
              </div>
            ))}
          </div>
          <div className="availability-summary">
            <span className="summary-number">0{available}</span>
            <span>
              espacios reservables
              <br />
              disponibles en Piso {seleccion.piso}
            </span>
            <ArrowUpRight size={18} />
          </div>
        </aside>
        <section className="map-center" aria-label="Explorar edificio">
          <Building
            piso={seleccion.piso}
            selected={seleccion.espacioId}
            onSelect={(space) =>
              store.seleccionar({ espacioId: space.id, piso: space.datos.piso })
            }
            estado={estado}
            search={search}
          />
          {search && (
            <div className="search-results" role="status">
              {matching.length
                ? `${matching.length} coincidencias en Piso ${seleccion.piso}`
                : "Sin coincidencias en este piso. Prueba otro nombre o equipamiento."}
            </div>
          )}
          <div
            className="map-room-list"
            aria-label={`Espacios del Piso ${seleccion.piso}`}
          >
            {spaces.map((space) => (
              <button
                key={space.id}
                onClick={() => store.seleccionar({ espacioId: space.id })}
                aria-pressed={space.id === seleccion.espacioId}
              >
                <span className={`tiny-dot ${estado(space.id)}`} />
                {space.nombre}
              </button>
            ))}
          </div>
          <div className="map-help">
            <CircleHelp size={15} />
            <span>
              Haz clic en una habitación. Tu siguiente idea empieza con un
              espacio.
            </span>
          </div>
        </section>
        <SpacePanel espacio={espacio} estado={estado(espacio.id)} />
      </div>
    </main>
  );
}
