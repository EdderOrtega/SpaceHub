# SpaceBook · Space Hub

Prototipo académico para **Metodologías de Análisis y Diseño de Sistemas II**. Explora un edificio isométrico de dos pisos y diez espacios, consulta la disponibilidad y administra reservaciones locales de una hora.

## Ejecutar

Desde la carpeta del repositorio `SpaceHub`, con Node.js 20.9 o posterior y npm:

```powershell
npm ci
npm run dev
```

Abre <http://localhost:3000>. `/` redirige al mapa y pide iniciar sesión si no hay sesión local. No necesita variables de entorno, servicios externos ni una base de datos.

Para producción local:

```powershell
npm run build
npm start
```

Stack: Next.js App Router, React, TypeScript estricto, Tailwind CSS y Lucide React. Se conservaron las versiones de Next.js y React del proyecto existente. No se añadieron Supabase, Prisma, pagos, servicios de autenticación ni Three.js.

## Cuentas de demostración

| Rol           | Correo                  | Contraseña    |
| ------------- | ----------------------- | ------------- |
| Usuario       | `usuario@spacehub.test` | `Usuario123!` |
| Administrador | `admin@spacehub.test`   | `Admin123!`   |

Los botones de demostración rellenan los campos; pulsa **Iniciar sesión**. La contraseña se valida y la sesión conserva únicamente el identificador de la cuenta. El botón de salida está junto al avatar.

## Las seis pantallas

| Pantalla             | Ruta             | Funciones                                                                             |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| Inicio de sesión     | `/login`         | Validación, errores, cuentas y sesión local                                           |
| Mapa interactivo     | `/mapa`          | Dos pisos, selección directa, fecha, horario, estados, búsqueda, zoom y panel lateral |
| Detalles del espacio | `/espacios/[id]` | Ilustración, capacidad, equipamiento, tipo y bloques disponibles                      |
| Confirmación         | `/reservar/[id]` | Resumen, validación final y folio de confirmación                                     |
| Mis reservaciones    | `/reservaciones` | Consulta propia, historial y cancelación con diálogo                                  |
| Administración       | `/admin`         | Consulta de espacios, bloqueo/habilitación y todas las reservaciones                  |

## Demostración sugerida

1. Entra con la cuenta de usuario. La selección inicial es Sala Creativa, mañana de 10:00 a 11:00.
2. Selecciona Sala B: está ocupada en ese bloque. Cambia a las 11:00 para verla disponible. Sala de Estudio está bloqueada.
3. Selecciona una sala disponible, abre sus detalles y confirma una reserva. Revisa su folio en Mis reservaciones y recarga para verificar la persistencia.
4. Cancela con confirmación y vuelve al mapa: el horario queda libre. El historial conserva el registro cancelado.
5. Cierra sesión y entra como administrador. Habilita Sala de Estudio, consulta las reservas y prueba bloquear otro espacio.

Las semillas se crean solo la primera vez. Contienen dos reservas para mañana: Sala B a las 10:00 para el administrador y Sala de Juntas a las 15:00 para el usuario de demostración. El horario de demostración se calcula al inicializar el navegador, sin fechas fijas que caduquen en el código.

## Reglas de negocio

- Bloques exactos de una hora, de 08:00–09:00 a 19:00–20:00, según la fecha/hora local del navegador. No se aceptan fechas inválidas, horas fraccionarias ni bloques que ya comenzaron.
- Una sola reserva confirmada por espacio, fecha y hora. Dos salas distintas sí pueden reservarse simultáneamente.
- Las oficinas privadas y el área común no se reservan. El área común es de uso libre; las oficinas tienen una asignación permanente.
- Bloquear un espacio impide nuevas reservas, conserva las existentes y prevalece en el estado del mapa. Habilitarlo no cambia su tipo ni elimina reservas previas.
- Solo la cuenta administradora puede bloquear, habilitar o consultar todas las reservas. Estos permisos se verifican en el gestor, no solo en la navegación; no se acepta un rol enviado por la UI.
- Cada cuenta consulta y cancela únicamente sus propias reservas. La cancelación se permite antes del inicio; una cancelada no puede cancelarse otra vez. No se borran registros.
- Las reservas confirmadas pasan a finalizadas al terminar su bloque. Se comprueban al iniciar la app, al recuperar el foco y cada minuto.
- La disponibilidad se recalcula tras cambios de fecha, horario, reservas y bloqueos. La confirmación vuelve a leer el almacenamiento y a validar dentro de una transacción.

## Organización del código

```text
app/                         Rutas de App Router, layout y estilos
components/screens/          Las seis pantallas
components/map/geometry.tsx  Primitivas 3D y proyección SVG
components/map/building.tsx  Habitaciones, mobiliario, selección y zoom
components/providers.tsx    Store React, sesión, selección y sincronización
data/demo.ts                Cuentas, diez espacios, composites y semillas
domain/types.ts             Contratos serializables
domain/fechas.ts             Bloques, validación y fechas locales
domain/composite.ts          ElementoMapa, Piso y Espacio
domain/reservacion.ts        Reservacion y sus objetos State
services/autenticacion.ts    Credenciales y controles de rol
services/gestor-reservaciones.ts  Reglas y operaciones del sistema
persistence/repositorio.ts  Persistencia, validación y transacciones
tests/domain.test.ts        Pruebas de negocio y patrones
tests/e2e/spacebook.spec.ts  Flujos de navegador y móvil
```

## Composite aplicado

`domain/composite.ts` define `ElementoMapa` con `obtenerEspacios` y `buscar`. `Piso` es el Composite: contiene otros elementos y delega su recorrido. `Espacio` es la hoja y devuelve su propio elemento. En `data/demo.ts` se construyen las dos instancias de Piso y se agregan las hojas.

`Building` consume directamente `piso.obtenerEspacios()` para dibujar las habitaciones; los botones de piso y la administración recorren la misma estructura. La búsqueda utilizada por el gestor también pasa por `Piso.buscar`. No hay una segunda lista de habitaciones dibujadas a mano ni un patrón sin uso.

## State aplicado

`domain/reservacion.ts` contiene `Reservacion`, `EstadoReserva`, `Confirmada`, `Cancelada` y `Finalizada`. `Reservacion.cancelar()` y `finalizar()` delegan al objeto de estado. `Confirmada` permite pasar a Cancelada o Finalizada; ambos estados terminales rechazan cancelaciones. Las transiciones no se resuelven mediante un switch de estados.

`serializar()` guarda un DTO; `recuperar()` reconstruye el objeto y su clase de estado usando un registro de fábricas. El gestor usa esa reconstrucción tanto para cancelar como para finalizar reservas vencidas. Las pruebas comprueban los tipos de las instancias y las transiciones antes y después de serializar.

## Colorfigures y mapa

Se evaluaron la skill instalada, su motor y los tres ejemplos. Se eligió SVG con React, adaptando sus técnicas de proyección, geometría volumétrica, sombreado y profundidad. `mountFigure` reemplaza el body de una página y no se integra directamente en el árbol React.

El mapa es SVG real y sus habitaciones son grupos interactivos accesibles. Se ven ambos pisos; el selector destaca el activo. Haz clic en el espacio o usa los botones bajo el mapa. Puedes usar Tab y Enter/Espacio. Los botones `+`, `−` y Restablecer controlan el zoom; arrastra una vez ampliado para desplazarte.

## Persistencia y concurrencia

Claves de localStorage: `spacebook:datos:v1`, `spacebook:sesion:v1` y `spacebook:seleccion:v1`. El repositorio valida los datos recuperados y comunica fallos de almacenamiento; no sustituye silenciosamente datos corruptos. Las pestañas escuchan `storage` para refrescarse.

En navegadores con Web Locks (incluido Chrome en localhost), todas las mutaciones usan la misma exclusión entre pestañas. De esta forma, dos confirmaciones concurrentes releen y validan los datos de forma secuencial. Sin Web Locks se mantiene la verificación síncrona en una pestaña, pero no se garantiza la exclusión entre pestañas.

Para reiniciar una demostración, elimina **solo** estas tres claves en las herramientas de desarrollo del navegador y recarga. Esto elimina los datos locales de SpaceBook; las semillas volverán a crearse.

## Verificación

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Pruebas de navegador con Chrome Stable instalado y actualizado (versión autorizada actual: `157.0.8103.39`):

```powershell
npm run test:e2e
```

La configuración selecciona `channel: "chrome"` y `chromiumSandbox: true`. Antes de los escenarios se comprueban la versión real, el ejecutable, los argumentos relevantes y el perfil temporal. Una versión distinta, un argumento inseguro o un fallo del sandbox detienen las pruebas; no hay fallback sin protecciones. Cuando Chrome se actualice, revisar la versión esperada con autorización antes de volver a ejecutar.

El servidor de pruebas utiliza exclusivamente `127.0.0.1:3000`, sin reutilizar servidores existentes; el puerto debe estar libre. Los controles HTTP y WebSocket se instalan antes de crear páginas y rechazan otros orígenes. Las redirecciones HTTP se rechazan sin seguirlas; los escenarios actuales no las necesitan. Los Service Workers están bloqueados y los contextos empiezan vacíos. La primera prueba comprueba rechazos intencionales contra un dominio `.invalid` y la redirección local de `/`; estos destinos externos no deben recibir conexiones.

Cada ejecución conserva reporte, trazas y adjuntos `browser-security.json` y `network-security.json` en `test-results/secure-<identificador>/`, excluido de Git. Los JSON no guardan consultas, credenciales, cabeceras ni cuerpos. No se heredan sesiones personales. Los controles de red se aplican a los contextos de prueba, no son un cortafuegos de Windows. El sandbox solicitado y la ausencia de argumentos inseguros **no demuestran aislamiento efectivo del sistema operativo**; el registro lo indica como no verificado. Estos controles no configuran el navegador integrado de Codex.

## Límites del prototipo

Las cuentas y contraseñas están en el código: es una sesión simulada, **no autenticación segura de producción**. El permiso de negocio evita usar funciones administrativas con una sesión normal, pero alguien con control del navegador puede editar localStorage o el código. Los datos no se comparten entre equipos, perfiles ni orígenes: `localhost` y `127.0.0.1` tienen almacenes distintos. No hay servidor de reservas, recuperación de cuenta ni pagos.

La vista isométrica es fija y el edificio, áreas y capacidades son ficticios. La cancelación no envía notificaciones reales. Los bloqueos no cancelan automáticamente reservas existentes. La hora se interpreta en el huso del navegador. No se ha desplegado un servicio remoto ni realizado cambios en GitHub.
