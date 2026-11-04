<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Seguridad E2E de SpaceBook

- Usar el Playwright local mediante `npm run test:e2e`, Chrome Stable y `chromiumSandbox: true`. La versión autorizada se comprueba antes de los escenarios; actualmente es `157.0.8103.39`. Revisar y autorizar el cambio esperado cuando Chrome se actualice.
- No añadir `--no-sandbox`, `--disable-setuid-sandbox`, excepciones TLS/CSP ni usar otro navegador para resolver un fallo de lanzamiento. Si falla una comprobación crítica, detenerse y conservar el error; no reintentar con protecciones reducidas.
- Mantener perfiles temporales y contextos vacíos. No importar sesiones, perfiles personales, CDP remoto ni variables de conexión/reutilización de Playwright.
- Las restricciones HTTP y WebSocket deben instalarse en el contexto antes de crear páginas. Solo se admite `http://127.0.0.1:3000` y su WebSocket local; Service Workers bloqueados. No seguir redirecciones HTTP automáticamente. Los únicos rechazos esperados son los de la prueba negativa de seguridad.
- Conservar evidencias saneadas en la carpeta única de cada ejecución: versiones reales, ruta, perfil temporal, argumentos relevantes y eventos de red. Nunca volcar cookies, cabeceras, cuerpos, secretos ni el entorno completo.
- Distinguir configuración/argumentos comprobados de aislamiento efectivo del SO: no declarar este último verificado sin evidencia independiente.
- El navegador integrado `mcp__cua_repl` y sus componentes compartidos son independientes de estos controles; no modificarlos ni usarlos como alternativa ante un fallo de seguridad E2E.
