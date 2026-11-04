"use client";

import { Fragment, useRef, useState, type PointerEvent } from "react";
import { LocateFixed, Minus, Move, Plus } from "lucide-react";
import { PISOS } from "@/data/demo";
import type { Espacio } from "@/domain/composite";
import type { Disponibilidad } from "@/domain/types";
import { ESTADO_NOMBRE } from "@/domain/types";
import {
  Box3,
  byDepth,
  Chair,
  Cylinder,
  Plant,
  polygon,
  project,
  Quad,
  Table,
  type Part,
  type Point3,
} from "./geometry";

const COLORS: Record<
  Disponibilidad,
  { floor: string; wall: string; line: string }
> = {
  disponible: { floor: "#e7f0db", wall: "#d6e6c8", line: "#5c9c66" },
  ocupado: { floor: "#f9e0d8", wall: "#f1c7bc", line: "#d87e70" },
  bloqueado: { floor: "#f7ecd7", wall: "#ecdfc1", line: "#c49842" },
  privado: { floor: "#e3eaf0", wall: "#d1dee6", line: "#8194a7" },
};

/** Toda pieza tiene soporte: patas al suelo, tablero a patas y macetas al suelo.
 * Pisos de 3,4 × 3,8 unidades de planta ilustrativa; muros próximos recortados.
 * El mapa usa los Espacio Leaf obtenidos de Piso (Composite), no otra lista visual.
 */
function Furniture({ espacio, z }: { espacio: Espacio; z: number }) {
  const { x, y, ancho: w, fondo: d } = espacio.datos.ubicacion;
  const parts: Part[] = [];
  const add = (id: string, at: Point3, size: Point3, node: Part["node"]) =>
    parts.push({
      id,
      at,
      box: [at, [at[0] + size[0], at[1] + size[1], at[2] + size[2]]],
      node,
    });
  if (espacio.datos.tipo === "comun" || espacio.id === "creativa") {
    const creative = espacio.id === "creativa";
    add(
      "rug",
      [x + 25, y + 35, z + 0.2],
      [w - 46, d - 60, 0.1],
      <Quad
        points={[
          [x + 25, y + 35, z + 0.2],
          [x + w - 21, y + 35, z + 0.2],
          [x + w - 21, y + d - 25, z + 0.2],
          [x + 25, y + d - 25, z + 0.2],
        ]}
        fill={creative ? "#d5e9e7" : "#e2e7df"}
        stroke="none"
      />,
    );
    add(
      "sofa",
      [x + 25, y + 30, z],
      [35, 79, 30],
      <>
        <Box3
          x={x + 25}
          y={y + 30}
          z={z + 3}
          w={34}
          d={78}
          h={14}
          color={creative ? "#8bbed0" : "#c8d3d8"}
          side="#829ca9"
          front="#aec0c8"
        />
        <Box3
          x={x + 25}
          y={y + 30}
          z={z + 16}
          w={9}
          d={78}
          h={18}
          color="#d9e5e8"
          side="#93adb7"
          front="#b8cbd2"
        />
        <Box3
          x={x + 25}
          y={y + 30}
          z={z + 16}
          w={35}
          d={8}
          h={10}
          color="#dbe5e5"
          side="#94acb6"
        />
        <Box3
          x={x + 25}
          y={y + 100}
          z={z + 16}
          w={35}
          d={8}
          h={10}
          color="#dbe5e5"
          side="#94acb6"
        />
      </>,
    );
    add(
      "pouf",
      [x + 85, y + 108, z],
      [25, 25, 17],
      <Cylinder
        x={x + 98}
        y={y + 120}
        z={z + 1}
        h={16}
        r={16}
        color="#f5ce72"
        side="#dfb35d"
      />,
    );
    add(
      "table",
      [x + 75, y + 55, z],
      [40, 37, 21],
      <Table x={x + 75} y={y + 55} z={z} w={40} d={37} height={17} />,
    );
    if (creative) {
      add(
        "board",
        [x + 13, y + 110, z],
        [6, 57, 55],
        <>
          <Box3
            x={x + 14}
            y={y + 115}
            z={z}
            w={2}
            d={2}
            h={45}
            color="#7c999d"
          />
          <Box3
            x={x + 14}
            y={y + 160}
            z={z}
            w={2}
            d={2}
            h={45}
            color="#7c999d"
          />
          <Box3
            x={x + 12}
            y={y + 110}
            z={z + 23}
            w={4}
            d={57}
            h={36}
            color="#fff9ec"
            side="#f2f3df"
            front="#e9f0de"
          />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Quad
              key={i}
              points={[
                [
                  x + 16.1,
                  y + 118 + (i % 3) * 14,
                  z + 32 + Math.floor(i / 3) * 14,
                ],
                [
                  x + 16.1,
                  y + 128 + (i % 3) * 14,
                  z + 32 + Math.floor(i / 3) * 14,
                ],
                [
                  x + 16.1,
                  y + 128 + (i % 3) * 14,
                  z + 41 + Math.floor(i / 3) * 14,
                ],
                [
                  x + 16.1,
                  y + 118 + (i % 3) * 14,
                  z + 41 + Math.floor(i / 3) * 14,
                ],
              ]}
              fill={["#f2c65f", "#99c8b4", "#eba996"][i % 3]}
              stroke="none"
            />
          ))}
        </>,
      );
    } else
      add(
        "chair",
        [x + 105, y + 45, z],
        [23, 25, 33],
        <Chair x={x + 117} y={y + 60} z={z} color="#a6bdc6" />,
      );
  } else {
    const isOffice =
      espacio.datos.tipo === "privada" || espacio.datos.tipo === "coworking";
    const tx = x + 47,
      ty = y + 35,
      tw = isOffice ? 60 : 68,
      td = Math.min(d - 60, isOffice ? 49 : 58);
    add(
      "table",
      [tx, ty, z],
      [tw, td, 45],
      <Table x={tx} y={ty} z={z} w={tw} d={td} laptop={isOffice} />,
    );
    const seats = isOffice
      ? [[tx + 30, ty + td + 14]]
      : [
          [tx + 20, ty - 14],
          [tx + 50, ty - 14],
          [tx + 20, ty + td + 14],
          [tx + 50, ty + td + 14],
        ];
    seats.forEach(([cx, cy], i) =>
      add(
        `seat-${i}`,
        [cx - 8, cy - 8, z],
        [17, 18, 34],
        <Chair x={cx} y={cy} z={z} back={i < 2 && !isOffice} />,
      ),
    );
    if (espacio.datos.tipo === "coworking" || espacio.id === "capacitacion") {
      add(
        "desk-two",
        [x + 50, y + 114, z],
        [71, 32, 45],
        <>
          <Table x={x + 50} y={y + 114} z={z} w={71} d={32} laptop={isOffice} />
          <Chair x={x + 80} y={y + 162} z={z} />
        </>,
      );
    }
    if (!isOffice)
      add(
        "screen",
        [x + 3, y + 34, z + 32],
        [2, 52, 28],
        <>
          <Quad
            points={[
              [x + 3, y + 28, z + 32],
              [x + 3, y + 83, z + 32],
              [x + 3, y + 83, z + 61],
              [x + 3, y + 28, z + 61],
            ]}
            fill="#345b65"
            stroke="#6c8589"
            width={1.5}
          />
          <Quad
            points={[
              [x + 3.1, y + 32, z + 36],
              [x + 3.1, y + 79, z + 36],
              [x + 3.1, y + 79, z + 57],
              [x + 3.1, y + 32, z + 57],
            ]}
            fill="#b5d5da"
            stroke="none"
          />
        </>,
      );
  }
  add(
    "plant",
    [x + 16, y + d - 23, z],
    [20, 20, 53],
    <Plant x={x + 24} y={y + d - 15} z={z} size={0.85} />,
  );
  add(
    "plant2",
    [x + w - 22, y + 13, z],
    [12, 12, 38],
    <Plant x={x + w - 15} y={y + 20} z={z} size={0.65} />,
  );
  return (
    <>
      {byDepth(parts).map((part) => (
        <Fragment key={part.id}>{part.node}</Fragment>
      ))}
    </>
  );
}

function Room({
  espacio,
  z,
  estado,
  selected,
  onSelect,
  muted = false,
}: {
  espacio: Espacio;
  z: number;
  estado: Disponibilidad;
  selected: boolean;
  onSelect?: () => void;
  muted?: boolean;
}) {
  const { x, y, ancho: w, fondo: d } = espacio.datos.ubicacion;
  const color = COLORS[estado];
  const [lx, ly] = project([x + w * 0.55, y + d * 0.5, z + 47]);
  const floor: Point3[] = [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
  ];
  const labelW = espacio.nombre.length * 6.7 + 30;
  return (
    <g
      className={`map-room ${selected ? "selected" : ""}`}
      style={{ opacity: muted ? 0.3 : 1 }}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={
        onSelect
          ? `${espacio.nombre}, piso ${espacio.datos.piso}, ${ESTADO_NOMBRE[estado]}`
          : undefined
      }
      aria-pressed={onSelect ? selected : undefined}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (onSelect && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect();
        }
      }}
      data-testid={onSelect ? `room-${espacio.id}` : undefined}
    >
      <title>
        {espacio.nombre} · {ESTADO_NOMBRE[estado]} · {espacio.datos.capacidad}{" "}
        personas
      </title>
      <Quad
        points={floor}
        fill={selected ? "#d2eeeb" : color.floor}
        stroke={selected ? "#099c9b" : "#a6b3a5"}
        width={selected ? 3 : 1}
      />
      <g opacity=".45">
        {[1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${project([x + (w * i) / 4, y, z + 0.1]).join(" ")}L${project([x + (w * i) / 4, y + d, z + 0.1]).join(" ")}`}
            stroke="#c7c3ad"
            strokeWidth=".65"
          />
        ))}
      </g>
      <Box3
        x={x}
        y={y}
        z={z}
        w={3}
        d={d}
        h={62}
        color="#f5f6ed"
        side={selected ? "#b9deda" : color.wall}
        front={color.wall}
      />
      <Box3
        x={x}
        y={y}
        z={z}
        w={w}
        d={3}
        h={62}
        color="#f8faf3"
        side={color.wall}
        front={selected ? "#b9deda" : "#dbe7de"}
      />
      <Furniture espacio={espacio} z={z} />
      <Quad
        points={[
          [x + w, y, z],
          [x + w, y + d * 0.77, z],
          [x + w, y + d * 0.77, z + 33],
          [x + w, y, z + 33],
        ]}
        fill={selected ? "#8ad8d6" : "#d0e5e5"}
        stroke={selected ? "#0ba8aa" : "#8fa7aa"}
        width={selected ? 2 : 1}
        opacity={0.45}
      />
      <path
        d={`M${project([x + w, y, z + 33]).join(" ")}L${project([x + w, y + d * 0.77, z + 33]).join(" ")}`}
        stroke={selected ? "#0ba8aa" : "#8fa7aa"}
        strokeWidth={1.5}
      />
      <Quad
        points={[
          [x, y + d, z],
          [x + w * 0.75, y + d, z],
          [x + w * 0.75, y + d, z + 8],
          [x, y + d, z + 8],
        ]}
        fill="#d9e3df"
        stroke="#9baead"
      />
      {selected && (
        <polygon
          className="selection-outline"
          points={polygon(floor)}
          fill="none"
          stroke="#0dadaa"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
      {onSelect && (
        <g className="room-label" transform={`translate(${lx} ${ly})`}>
          <rect
            x={-labelW / 2}
            y={-13}
            width={labelW}
            height={26}
            rx="13"
            fill={selected ? "#e7fbf8" : "#fffef9"}
            stroke={selected ? "#099c9b" : color.line}
            strokeWidth={selected ? 1.7 : 0.9}
          />
          <circle
            cx={-labelW / 2 + 13}
            cy="0"
            r="4.2"
            fill={selected ? "#09aaa1" : color.line}
          />
          {(estado === "privado" || estado === "bloqueado") && (
            <path
              d={`M${-labelW / 2 + 10} 0h6m-5 -2v-2a2 2 0 0 1 4 0v2`}
              fill="none"
              stroke="white"
              strokeWidth=".9"
            />
          )}
          <text
            x="6"
            y="4"
            textAnchor="middle"
            fill="#193e45"
            fontSize="11.5"
            fontWeight="650"
          >
            {espacio.nombre}
          </text>
        </g>
      )}
    </g>
  );
}

export function RoomIllustration({
  espacio,
  className = "",
  estado = "disponible",
}: {
  espacio: Espacio;
  className?: string;
  estado?: Disponibilidad;
}) {
  const { x, y, ancho: w, fondo: d } = espacio.datos.ubicacion;
  const [cx, cy] = project([x + w / 2, y + d / 2, 0]);
  return (
    <svg
      className={`room-illustration ${className}`}
      viewBox={`${cx - 164} ${cy - 142} 328 247`}
      role="img"
      aria-label={`Ilustración de ${espacio.nombre}`}
    >
      <rect x={cx - 164} y={cy - 142} width="328" height="247" fill="#edf4f0" />
      <ellipse
        cx={cx}
        cy={cy + 53}
        rx="133"
        ry="25"
        fill="#608a9a"
        opacity=".12"
      />
      <Room espacio={espacio} z={0} estado={estado} selected={false} />
    </svg>
  );
}

interface MapProps {
  piso: number;
  selected: string;
  onSelect: (espacio: Espacio) => void;
  estado: (id: string) => Disponibilidad;
  search?: string;
}
export function Building({
  piso,
  selected,
  onSelect,
  estado,
  search = "",
}: MapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
    moved: boolean;
  } | null>(null);
  const select = (espacio: Espacio) => {
    if (!drag.current?.moved) onSelect(espacio);
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (drag.current && zoom > 1) {
      const dx = event.clientX - drag.current.x,
        dy = event.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.current.moved = true;
      setPan({
        x: Math.max(-200, Math.min(200, drag.current.px + dx)),
        y: Math.max(-200, Math.min(200, drag.current.py + dy)),
      });
    }
  };
  return (
    <div className="building-stage">
      <div className="map-stage-top">
        <span className="map-kicker">
          <span className="live-dot" /> DISPONIBILIDAD EN TIEMPO REAL
        </span>
        <span className="map-view-name">Vista isométrica</span>
      </div>
      <svg
        className={`building-svg ${zoom > 1 ? "zoomed" : ""}`}
        viewBox="70 -5 790 855"
        role="group"
        aria-label="Mapa isométrico interactivo de Space Hub, dos pisos"
        onPointerDown={(event) => {
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            px: pan.x,
            py: pan.y,
            moved: false,
          };
        }}
        onPointerMove={move}
        onPointerUp={() => {
          setTimeout(() => {
            drag.current = null;
          }, 0);
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
      >
        <g
          transform={`translate(${pan.x} ${pan.y}) translate(465 425) scale(${zoom}) translate(-465 -425)`}
        >
          <ellipse
            cx="467"
            cy="786"
            rx="307"
            ry="39"
            fill="#3b7899"
            opacity=".09"
          />
          <path
            d="M155 245v332M785 234v330"
            stroke="#81b8bc"
            strokeWidth="1"
            strokeDasharray="5 6"
            opacity=".6"
          />
          {PISOS.map((floor) => {
            const z = floor.numero === 2 ? 385 : 0;
            return (
              <g
                key={floor.id}
                className={`building-floor ${floor.numero === piso ? "active-floor" : "inactive-floor"}`}
                data-floor={floor.numero}
              >
                <Box3
                  x={-9}
                  y={-9}
                  z={z - 13}
                  w={358}
                  d={398}
                  h={13}
                  color="#f9f4e8"
                  side="#b6c4c8"
                  front="#d5dedf"
                  stroke="#83999c"
                />
                {floor
                  .obtenerEspacios()
                  .sort(
                    (a, b) =>
                      a.datos.ubicacion.x +
                      a.datos.ubicacion.y -
                      (b.datos.ubicacion.x + b.datos.ubicacion.y),
                  )
                  .map((espacio) => (
                    <Room
                      key={espacio.id}
                      espacio={espacio}
                      z={z}
                      estado={estado(espacio.id)}
                      selected={espacio.id === selected}
                      onSelect={() => select(espacio)}
                      muted={
                        !!search &&
                        !`${espacio.nombre} ${espacio.datos.equipo.join(" ")}`
                          .toLowerCase()
                          .includes(search.toLowerCase())
                      }
                    />
                  ))}
                <g
                  transform={`translate(109 ${floor.numero === 2 ? 193 : 578})`}
                  aria-hidden="true"
                >
                  <rect
                    width="77"
                    height="29"
                    rx="14.5"
                    fill={floor.numero === piso ? "#0b918e" : "#fff"}
                    stroke={floor.numero === piso ? "#0b918e" : "#c2d9d6"}
                  />
                  <text
                    x="38.5"
                    y="19"
                    fill={floor.numero === piso ? "#fff" : "#547879"}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="650"
                  >
                    Piso {floor.numero}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="map-bottom">
        <span>
          <Move size={14} />{" "}
          {zoom > 1
            ? "Arrastra para desplazarte"
            : "Selecciona un espacio para explorarlo"}
        </span>
        <div className="zoom-controls">
          <button
            className="icon-button"
            aria-label="Alejar mapa"
            onClick={() => {
              setZoom((z) => Math.max(1, z - 0.2));
              if (zoom <= 1.2) setPan({ x: 0, y: 0 });
            }}
            disabled={zoom <= 1}
          >
            <Minus size={16} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            className="icon-button"
            aria-label="Acercar mapa"
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))}
            disabled={zoom >= 1.8}
          >
            <Plus size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Restablecer vista"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <LocateFixed size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
