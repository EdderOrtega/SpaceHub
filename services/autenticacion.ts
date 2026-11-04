import { CUENTAS } from "../data/demo";
import { SESION_KEY, type Almacenamiento } from "../persistence/repositorio";
import type { Usuario } from "../domain/types";

export class Autenticacion {
  constructor(private readonly storage: Almacenamiento) {}
  iniciarSesion(email: string, password: string): Usuario {
    const cuenta = CUENTAS.find(
      (usuario) =>
        usuario.email === email.trim().toLowerCase() &&
        usuario.password === password,
    );
    if (!cuenta) throw new Error("El correo o la contraseña no son correctos.");
    this.storage.setItem(SESION_KEY, cuenta.id);
    return this.requerirUsuario();
  }
  usuarioActual(): Usuario | null {
    const cuenta = CUENTAS.find(
      (usuario) => usuario.id === this.storage.getItem(SESION_KEY),
    );
    if (!cuenta) return null;
    return {
      id: cuenta.id,
      nombre: cuenta.nombre,
      email: cuenta.email,
      rol: cuenta.rol,
    };
  }
  requerirUsuario(): Usuario {
    const usuario = this.usuarioActual();
    if (!usuario) throw new Error("Inicia sesión para continuar.");
    return usuario;
  }
  requerirAdmin(): Usuario {
    const usuario = this.requerirUsuario();
    if (usuario.rol !== "admin")
      throw new Error("Solo el administrador puede realizar esta operación.");
    return usuario;
  }
  cerrarSesion(): void {
    this.storage.removeItem(SESION_KEY);
  }
}
