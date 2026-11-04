import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpaceBook · Haz espacio para tus ideas",
  description:
    "Explora Space Hub en un mapa isométrico, consulta la disponibilidad y reserva tu próximo espacio de trabajo.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
