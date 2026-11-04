import { Box3, Plant, Quad, project } from "./map/geometry";

export function HubIllustration({ className = "" }: { className?: string }) {
  const [cx, cy] = project([90, 100, 65]);
  return (
    <svg
      className={`hub-illustration ${className}`}
      viewBox={`${cx - 190} ${cy - 170} 380 350`}
      role="img"
      aria-label="Edificio de dos pisos de Space Hub"
    >
      <ellipse
        cx={cx}
        cy={cy + 105}
        rx="172"
        ry="22"
        fill="#72aaa3"
        opacity=".13"
      />
      <Box3
        x={-10}
        y={-10}
        z={-5}
        w={204}
        d={218}
        h={5}
        color="#e3e9de"
        side="#adc6bd"
      />
      <Box3
        x={0}
        y={0}
        z={0}
        w={180}
        d={190}
        h={132}
        color="#f9fbf5"
        side="#c1dbd7"
        front="#eef6eb"
      />
      <Box3
        x={-5}
        y={-5}
        z={133}
        w={190}
        d={200}
        h={5}
        color="#edf5ef"
        side="#90bab6"
        front="#cce1da"
      />
      {[0, 1].map((floor) => (
        <g key={floor}>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <Quad
                points={[
                  [181, 14 + i * 32, 15 + floor * 70],
                  [181, 40 + i * 32, 15 + floor * 70],
                  [181, 40 + i * 32, 57 + floor * 70],
                  [181, 14 + i * 32, 57 + floor * 70],
                ]}
                fill={floor ? "#81bdc8" : "#b7d8d3"}
                stroke="#5f9da7"
                width={2}
              />
              <Quad
                points={[
                  [12 + i * 32, 191, 15 + floor * 70],
                  [39 + i * 32, 191, 15 + floor * 70],
                  [39 + i * 32, 191, 57 + floor * 70],
                  [12 + i * 32, 191, 57 + floor * 70],
                ]}
                fill="#8ec5cc"
                stroke="#639c9f"
                width={2}
              />
            </g>
          ))}
        </g>
      ))}
      <Box3 x={183} y={117} z={0} w={16} d={49} h={5} color="#d3dbce" />
      <Plant x={185} y={185} z={0} size={1.2} />
      <Plant x={15} y={204} z={0} size={1.25} />
      <Plant x={-15} y={155} z={0} size={1.5} />
      <text
        x={project([181, 93, 68])[0]}
        y={project([181, 93, 68])[1]}
        fontSize="16"
        fontWeight="800"
        fill="#0c6068"
        transform={`rotate(-27 ${project([181, 93, 68]).join(" ")})`}
      >
        Space Hub
      </text>
    </svg>
  );
}
