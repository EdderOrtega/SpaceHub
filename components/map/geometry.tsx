import type { ReactNode } from "react";

/** Adaptación React de proyección P0, box, cyl y byDepth de Colorfigures.
 * Vista arquitectónica fija: x = profundidad, y = anchura, z = altura.
 * Muros próximos recortados para explorar habitaciones; no se simula giro orbital.
 */
export type Point3 = readonly [number, number, number];
export const project = ([x, y, z]: Point3): [number, number] => [
  477 + (x - y) * 0.866,
  465 + (x + y) * 0.44 - z,
];
export const polygon = (points: Point3[]) =>
  points.map((point) => project(point).join(",")).join(" ");
export function Quad({
  points,
  fill,
  stroke = "#698182",
  width = 0.8,
  opacity = 1,
}: {
  points: Point3[];
  fill: string;
  stroke?: string;
  width?: number;
  opacity?: number;
}) {
  return (
    <polygon
      points={polygon(points)}
      fill={fill}
      stroke={stroke}
      strokeWidth={width}
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}
export function Box3({
  x,
  y,
  z,
  w,
  d,
  h,
  color = "#f4ede0",
  side = "#bfcac6",
  front = "#d7ded8",
  stroke = "#7a9290",
  opacity = 1,
}: {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color?: string;
  side?: string;
  front?: string;
  stroke?: string;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <Quad
        points={[
          [x, y + d, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ]}
        fill={side}
        stroke={stroke}
      />
      <Quad
        points={[
          [x + w, y, z],
          [x + w, y + d, z],
          [x + w, y + d, z + h],
          [x + w, y, z + h],
        ]}
        fill={front}
        stroke={stroke}
      />
      <Quad
        points={[
          [x, y, z + h],
          [x + w, y, z + h],
          [x + w, y + d, z + h],
          [x, y + d, z + h],
        ]}
        fill={color}
        stroke={stroke}
      />
    </g>
  );
}
export function Cylinder({
  x,
  y,
  z,
  h,
  r,
  color,
  side = color,
}: {
  x: number;
  y: number;
  z: number;
  h: number;
  r: number;
  color: string;
  side?: string;
}) {
  const [px] = project([x, y, z]);
  const [, top] = project([x, y, z + h]);
  return (
    <g stroke="#78938b" strokeWidth=".65">
      <path
        d={`M${px - r} ${top}v${h}a${r} ${r * 0.48} 0 0 0 ${r * 2} 0v-${h}`}
        fill={side}
      />
      <ellipse cx={px} cy={top} rx={r} ry={r * 0.48} fill={color} />
    </g>
  );
}
export interface Part {
  at: Point3;
  box: [Point3, Point3];
  node: ReactNode;
  id: string;
}
export function byDepth(parts: Part[]): Part[] {
  return [...parts].sort((a, b) => {
    for (const k of [0, 1, 2]) {
      if (a.box[1][k] <= b.box[0][k]) return -1;
      if (b.box[1][k] <= a.box[0][k]) return 1;
    }
    return (
      a.at.reduce((sum, value) => sum + value, 0) -
      b.at.reduce((sum, value) => sum + value, 0)
    );
  });
}
export function Plant({
  x,
  y,
  z,
  size = 1,
}: {
  x: number;
  y: number;
  z: number;
  size?: number;
}) {
  const [px, py] = project([x, y, z]);
  return (
    <g transform={`translate(${px} ${py}) scale(${size})`}>
      <ellipse cy="1" rx="13" ry="5" fill="#36646a" opacity=".1" />
      <path
        d="M-9 -16L-7 0Q0 6 7 0L9 -16"
        fill="#f5ead5"
        stroke="#9b9d81"
        strokeWidth=".8"
      />
      <ellipse cy="-16" rx="9" ry="4" fill="#d8c6a4" />
      <path
        d="M0 -16V-49M0 -28L-14 -40M0 -33L13 -49M0 -22L14 -31"
        stroke="#688b42"
        strokeWidth="2"
        fill="none"
      />
      <ellipse
        cx="-11"
        cy="-39"
        rx="6"
        ry="13"
        transform="rotate(-42 -11 -39)"
        fill="#94b861"
        stroke="#6f994a"
        strokeWidth=".7"
      />
      <ellipse
        cx="3"
        cy="-48"
        rx="6"
        ry="14"
        transform="rotate(15 3 -48)"
        fill="#bdd383"
        stroke="#84a754"
        strokeWidth=".7"
      />
      <ellipse
        cx="14"
        cy="-43"
        rx="6"
        ry="12"
        transform="rotate(35 14 -43)"
        fill="#83ad55"
        stroke="#6a9545"
        strokeWidth=".7"
      />
      <ellipse
        cx="-9"
        cy="-27"
        rx="6"
        ry="12"
        transform="rotate(-49 -9 -27)"
        fill="#b8cf7e"
        stroke="#779e4a"
        strokeWidth=".7"
      />
      <ellipse
        cx="12"
        cy="-28"
        rx="5"
        ry="10"
        transform="rotate(49 12 -28)"
        fill="#a5c56c"
        stroke="#789f47"
        strokeWidth=".7"
      />
    </g>
  );
}
export function Chair({
  x,
  y,
  z,
  back = false,
  color = "#477d84",
}: {
  x: number;
  y: number;
  z: number;
  back?: boolean;
  color?: string;
}) {
  return (
    <g>
      <Box3 x={x - 5} y={y - 5} z={z} w={1.5} d={1.5} h={15} color="#758d8b" />
      <Box3 x={x + 5} y={y + 5} z={z} w={1.5} d={1.5} h={15} color="#758d8b" />
      <Box3
        x={x - 7}
        y={y - 7}
        z={z + 14}
        w={16}
        d={16}
        h={3}
        color={color}
        side="#416c72"
        front="#56828a"
      />
      <Box3
        x={x - 7}
        y={back ? y - 8 : y + 6}
        z={z + 17}
        w={16}
        d={3}
        h={16}
        color="#90b1b5"
        side={color}
        front={color}
      />
    </g>
  );
}
export function Table({
  x,
  y,
  z,
  w = 68,
  d = 43,
  height = 25,
  laptop = false,
}: {
  x: number;
  y: number;
  z: number;
  w?: number;
  d?: number;
  height?: number;
  laptop?: boolean;
}) {
  return (
    <g>
      {[
        [3, 3],
        [w - 5, 3],
        [3, d - 5],
        [w - 5, d - 5],
      ].map(([dx, dy], i) => (
        <Box3
          key={i}
          x={x + dx}
          y={y + dy}
          z={z}
          w={2}
          d={2}
          h={height}
          color="#b1ad9c"
          side="#8e968a"
          front="#b8bdac"
        />
      ))}
      <Box3
        x={x}
        y={y}
        z={z + height}
        w={w}
        d={d}
        h={4}
        color="#f2d5a2"
        side="#c4aa80"
        front="#e5c392"
      />
      {laptop && (
        <>
          <Box3
            x={x + 18}
            y={y + 10}
            z={z + height + 4}
            w={21}
            d={15}
            h={1.6}
            color="#d5e0de"
            side="#7a9797"
          />
          <Box3
            x={x + 18}
            y={y + 10}
            z={z + height + 6}
            w={1.5}
            d={15}
            h={13}
            color="#8dabae"
            side="#345f6a"
            front="#97c3ce"
          />
        </>
      )}
    </g>
  );
}
