"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowLeft,
  Box,
  CalendarDays,
  Check,
  CircleHelp,
  Layers,
  LockKeyhole,
  LogOut,
  Map,
  ShieldCheck,
  X,
} from "lucide-react";
import type { Disponibilidad, NombreEstado } from "@/domain/types";
import { ESTADO_NOMBRE } from "@/domain/types";
import { useSpaceBook } from "./providers";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark">
        <Box size={27} strokeWidth={1.7} />
      </span>
      <span>
        Space<span className="brand-book">Book</span>
        <small>by Space Hub</small>
      </span>
    </span>
  );
}
export function Loading() {
  return (
    <div className="loading">
      <span className="loading-mark">
        <Box />
      </span>
      <p>Preparando tu espacio…</p>
    </div>
  );
}
export function Gate({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { listo, usuario, error } = useSpaceBook();
  const router = useRouter();
  useEffect(() => {
    if (listo && !usuario && !error) router.replace("/login");
  }, [listo, usuario, error, router]);
  if (error)
    return (
      <main className="error-page">
        <Logo />
        <h1>No pudimos abrir tus datos</h1>
        <p role="alert">{error}</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Volver a intentar
        </button>
      </main>
    );
  if (!listo || !usuario) return <Loading />;
  if (admin && usuario.rol !== "admin")
    return (
      <Shell>
        <div className="empty-state">
          <LockKeyhole />
          <h1>Acceso restringido</h1>
          <p>Esta sección está disponible para la cuenta administradora.</p>
          <Link href="/mapa" className="button primary">
            Volver al mapa
          </Link>
        </div>
      </Shell>
    );
  return <Shell>{children}</Shell>;
}
function Shell({ children }: { children: ReactNode }) {
  const { usuario, store } = useSpaceBook();
  const pathname = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/mapa", label: "Mapa", icon: Map },
    { href: "/reservaciones", label: "Mis reservaciones", icon: CalendarDays },
    ...(usuario?.rol === "admin"
      ? [{ href: "/admin", label: "Administración", icon: ShieldCheck }]
      : []),
  ];
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/mapa" aria-label="SpaceBook, ir al mapa">
          <Logo />
        </Link>
        <nav aria-label="Navegación principal">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "nav-link active" : "nav-link"}
              aria-current={pathname === href ? "page" : undefined}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="account">
          <span className="avatar">
            {usuario?.nombre
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <span className="account-name">
            {usuario?.nombre}
            <small>
              {usuario?.rol === "admin"
                ? "Administrador"
                : "Miembro de Space Hub"}
            </small>
          </span>
          <button
            className="icon-button logout"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={() => {
              store.logout();
              router.replace("/login");
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      {children}
      <footer className="app-footer">
        <span>
          <Box size={14} /> Space Hub · Haz espacio para tus ideas.
        </span>
        <span>
          Prototipo académico <span className="footer-dot" /> Datos locales de
          demostración
        </span>
      </footer>
    </div>
  );
}
export function Badge({ estado }: { estado: Disponibilidad }) {
  return (
    <span className={`badge ${estado}`}>
      <span className="status-dot">
        {estado === "bloqueado" || estado === "privado" ? (
          <LockKeyhole size={10} />
        ) : estado === "disponible" ? (
          <Check size={10} />
        ) : (
          <X size={10} />
        )}
      </span>
      {ESTADO_NOMBRE[estado]}
    </span>
  );
}
export function ReservationBadge({ estado }: { estado: NombreEstado }) {
  return (
    <span className={`reservation-badge ${estado}`}>
      {estado === "confirmada" ? (
        <Check size={13} />
      ) : estado === "cancelada" ? (
        <X size={13} />
      ) : (
        <CalendarDays size={13} />
      )}
      {estado[0].toUpperCase() + estado.slice(1)}
    </span>
  );
}
export function BackLink({
  href = "/mapa",
  children = "Volver al mapa",
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <Link className="back-link" href={href}>
      <ArrowLeft size={17} />
      {children}
    </Link>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      <div className="location-chip">
        <span className="location-icon">
          <Layers size={20} />
        </span>
        <span>
          Space Hub<small>2 pisos · 10 espacios</small>
        </span>
        <span className="live-dot" />
      </div>
    </div>
  );
}
export function Info({ children }: { children: ReactNode }) {
  return (
    <div className="info-box">
      <CircleHelp size={18} />
      <span>{children}</span>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      className="modal"
      ref={ref}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Cerrar diálogo"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
