import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <span className="eyebrow">SPACEBOOK · 404</span>
      <h1>Este espacio todavía no existe.</h1>
      <p>Vuelve al mapa para encontrar tu lugar.</p>
      <Link href="/mapa" className="button primary">
        Volver al mapa
      </Link>
    </main>
  );
}
