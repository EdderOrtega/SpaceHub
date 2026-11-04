"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { CUENTAS } from "@/data/demo";
import { Logo, Loading } from "../ui";
import { HubIllustration } from "../hub-illustration";
import { useSpaceBook } from "../providers";

export function LoginScreen() {
  const { listo, usuario, error: storageError, store } = useSpaceBook();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (listo && usuario) router.replace("/mapa");
  }, [listo, usuario, router]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      store.login(email, password);
      router.replace("/mapa");
    } catch (error) {
      setError((error as Error).message);
    }
  };
  if (!listo || usuario) return <Loading />;
  return (
    <main className="login-page">
      <section className="login-story">
        <Logo />
        <div className="login-intro">
          <span className="eyebrow">MENOS FRICCIÓN. MÁS IDEAS.</span>
          <h1>
            Un buen día empieza
            <br />
            en el <em>espacio correcto.</em>
          </h1>
          <p>
            Tu próxima reunión, tu momento de enfoque,
            <br />
            tu lugar para crear. Encuéntralo en Space Hub.
          </p>
        </div>
        <div className="login-art">
          <div className="art-orbit" />
          <HubIllustration />
          <span className="floating-tag tag-top">
            <span className="live-dot" />
            Tu próxima gran idea vive aquí
          </span>
          <span className="floating-tag tag-bottom">
            <Check size={15} />
            Espacios que se adaptan a ti
          </span>
        </div>
        <div className="login-story-footer">
          <span>EXPLORA</span>
          <i />
          <span>ELIGE</span>
          <i />
          <span>RESERVA</span>
          <small>Así de sencillo.</small>
        </div>
      </section>
      <section className="login-form-side">
        <div className="login-form-wrap">
          <span className="welcome-icon">
            <UserRound size={25} />
          </span>
          <div className="eyebrow">BIENVENIDO A SPACEBOOK</div>
          <h2>Haz espacio para ti.</h2>
          <p>Inicia sesión para encontrar tu lugar.</p>
          <form onSubmit={submit}>
            <label className="form-label" htmlFor="email">
              Correo electrónico
            </label>
            <div className="form-input">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                placeholder="tu@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div className="form-input">
              <LockKeyhole size={18} />
              <input
                id="password"
                type={visible ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="icon-button"
                aria-label={
                  visible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {(error || storageError) && (
              <p className="form-error" role="alert">
                {error || storageError}
              </p>
            )}
            <button
              type="submit"
              className="button primary full login-submit"
              disabled={!!storageError}
            >
              Iniciar sesión
              <ArrowRight size={19} />
            </button>
          </form>
          <div className="demo-divider">
            <span>Cuentas de demostración</span>
          </div>
          <div className="demo-accounts">
            {CUENTAS.map((cuenta) => (
              <button
                key={cuenta.id}
                type="button"
                className="demo-account"
                aria-label={`Usar cuenta de ${cuenta.rol}`}
                onClick={() => {
                  setEmail(cuenta.email);
                  setPassword(cuenta.password);
                  setError("");
                }}
              >
                <span className="demo-icon">
                  {cuenta.rol === "admin" ? (
                    <ShieldCheck size={19} />
                  ) : (
                    <UserRound size={19} />
                  )}
                </span>
                <span>
                  <strong>
                    {cuenta.rol === "admin" ? "Administrador" : "Usuario"}
                  </strong>
                  <small>{cuenta.email}</small>
                  <code>{cuenta.password}</code>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
          <p className="demo-notice">
            <LockKeyhole size={13} />
            Prototipo académico · Sesión simulada y datos locales.
          </p>
        </div>
        <span className="login-copyright">SpaceBook © 2026 · Space Hub</span>
      </section>
    </main>
  );
}
