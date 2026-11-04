import { test as base, expect, type Page } from "@playwright/test";
import { realpathSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const ORIGIN = "http://127.0.0.1:3000";
const WS_ORIGIN = "ws://127.0.0.1:3000";
const PROBE = "seguridad: HTTP, redirecciones y WebSocket bloqueados";
type NetworkEvent = {
  kind: "http" | "websocket";
  url: string;
  action: "allowed" | "blocked" | "redirect-blocked" | "failed";
  status?: number;
  target?: string;
  expected?: boolean;
};
function requireSecurity(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(`E2E_SECURITY: ${message}`);
}
function safeUrl(value: string, baseUrl = ORIGIN): string {
  try {
    const url = new URL(value, baseUrl);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "[invalid URL]";
  }
}

// This override wraps the original context fixture, before the default page fixture.
const test = base.extend<{ securityEvents: NetworkEvent[] }>({
  securityEvents: async ({ baseURL }, provide) => {
    requireSecurity(baseURL === ORIGIN, "unexpected test origin");
    await provide([]);
  },
  context: async ({ context, securityEvents }, provide, testInfo) => {
    requireSecurity(
      context.pages().length === 0,
      "a page existed before network restrictions",
    );
    const initial = await context.storageState();
    requireSecurity(
      initial.cookies.length === 0 && initial.origins.length === 0,
      "context was not empty",
    );
    requireSecurity(
      context.serviceWorkers().length === 0,
      "unexpected active Service Worker",
    );
    let closing = false;
    const block = (event: NetworkEvent, rawUrl: string) => {
      event.expected =
        testInfo.title === PROBE &&
        ((event.action === "redirect-blocked" && rawUrl === `${ORIGIN}/`) ||
          rawUrl === "https://spacebook-e2e.invalid/probe" ||
          rawUrl === "wss://spacebook-e2e.invalid/probe");
      securityEvents.push(event);
      if (!event.expected)
        void context
          .close({ reason: "E2E_SECURITY: unexpected network destination" })
          .catch(() => {});
    };
    await context.route("**/*", async (route) => {
      const rawUrl = route.request().url();
      const url = new URL(rawUrl);
      if (url.origin !== ORIGIN || url.username || url.password) {
        await route.abort("blockedbyclient");
        block(
          { kind: "http", url: safeUrl(rawUrl), action: "blocked" },
          rawUrl,
        );
        return;
      }
      try {
        // Do not let route.fetch silently follow a redirect to another origin.
        const response = await route.fetch({ maxRedirects: 0, timeout: 30000 });
        const status = response.status();
        if (status >= 300 && status < 400 && status !== 304) {
          await route.abort("blockedbyclient");
          block(
            {
              kind: "http",
              url: safeUrl(rawUrl),
              action: "redirect-blocked",
              status,
              target: safeUrl(response.headers().location ?? "", rawUrl),
            },
            rawUrl,
          );
        } else {
          securityEvents.push({
            kind: "http",
            url: safeUrl(rawUrl),
            action: "allowed",
            status,
          });
          await route.fulfill({ response });
        }
        await response.dispose();
      } catch {
        if (!closing) {
          await route.abort("failed").catch(() => {});
          securityEvents.push({
            kind: "http",
            url: safeUrl(rawUrl),
            action: "failed",
          });
          void context
            .close({ reason: "E2E_SECURITY: HTTP inspection failed" })
            .catch(() => {});
        }
      }
    });
    await context.routeWebSocket("**/*", async (socket) => {
      const rawUrl = socket.url();
      const url = new URL(rawUrl);
      if (url.origin !== WS_ORIGIN || url.username || url.password) {
        await socket.close({ code: 1008, reason: "E2E origin not allowed" });
        block(
          { kind: "websocket", url: safeUrl(rawUrl), action: "blocked" },
          rawUrl,
        );
      } else {
        securityEvents.push({
          kind: "websocket",
          url: safeUrl(rawUrl),
          action: "allowed",
        });
        socket.connectToServer();
      }
    });
    try {
      await provide(context);
    } finally {
      closing = true;
      await context.close();
      await testInfo.attach("network-security.json", {
        body: JSON.stringify(
          {
            runId: testInfo.config.metadata.runId,
            restrictionsBeforePages: true,
            emptyInitialStorage: true,
            serviceWorkers: "block",
            events: securityEvents,
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      requireSecurity(
        !securityEvents.some(
          (event) =>
            event.action === "failed" ||
            ((event.action === "blocked" ||
              event.action === "redirect-blocked") &&
              !event.expected),
        ),
        "network policy or inspection failed; remaining scenarios must stop",
      );
    }
  },
});

test.beforeAll(async ({ browser }, testInfo) => {
  const report = {
    runId: testInfo.config.metadata.runId,
    timestamp: new Date().toISOString(),
    playwright: testInfo.config.version,
    expectedChrome: testInfo.config.metadata.expectedChrome,
    actualChrome: browser.version(),
    executable: "",
    temporaryProfile: "",
    relevantArguments: [] as string[],
    sandbox: {
      requested: testInfo.project.use.launchOptions?.chromiumSandbox === true,
      commandLineChecked: false,
      osIsolationVerified: false,
    },
    result: "checking",
    failure: "",
  };
  let session;
  try {
    requireSecurity(
      report.actualChrome === report.expectedChrome,
      "Chrome version differs from the authorized version",
    );
    requireSecurity(
      testInfo.project.use.channel === "chrome" && report.sandbox.requested,
      "Chrome channel/sandbox configuration differs",
    );
    requireSecurity(
      browser.contexts().length === 0,
      "browser already had contexts",
    );
    session = await browser.newBrowserCDPSession();
    const { arguments: args } = await session.send(
      "Browser.getBrowserCommandLine",
    );
    const { product } = await session.send("Browser.getVersion");
    requireSecurity(
      product === `Chrome/${report.expectedChrome}` ||
        product === `HeadlessChrome/${report.expectedChrome}`,
      "unexpected browser product",
    );
    report.executable = realpathSync(args[0]);
    requireSecurity(
      report.executable.toLowerCase() ===
        realpathSync(
          "C:/Program Files/Google/Chrome/Application/chrome.exe",
        ).toLowerCase(),
      "unexpected Chrome executable",
    );
    const unsafe = args.filter((arg) =>
      /^--(?:no-sandbox|disable-setuid-sandbox|disable-web-security|ignore-certificate-errors)(?:=|$)/.test(
        arg,
      ),
    );
    requireSecurity(
      unsafe.length === 0,
      "unsafe browser launch argument detected",
    );
    requireSecurity(
      args.some((arg) => /^--headless(?:=|$)/.test(arg)),
      "expected headless browser",
    );
    const profileArg = args.find((arg) => arg.startsWith("--user-data-dir="));
    requireSecurity(profileArg, "temporary profile argument missing");
    report.temporaryProfile = realpathSync(
      profileArg.slice("--user-data-dir=".length),
    );
    const relative = path.relative(
      realpathSync(tmpdir()),
      report.temporaryProfile,
    );
    requireSecurity(
      relative !== "" &&
        !relative.startsWith("..") &&
        !path.isAbsolute(relative) &&
        path
          .basename(report.temporaryProfile)
          .startsWith("playwright_chromiumdev_profile-"),
      "browser profile is not a Playwright temporary profile",
    );
    report.relevantArguments = args.filter((arg) =>
      /^--(?:headless|user-data-dir|remote-debugging-pipe|no-sandbox|disable-setuid-sandbox)(?:=|$)/.test(
        arg,
      ),
    );
    report.sandbox.commandLineChecked = true;
    report.result = "passed";
  } catch (error) {
    report.result = "failed";
    report.failure =
      error instanceof Error ? error.message : "critical browser check failed";
    throw error;
  } finally {
    await session?.detach().catch(() => {});
    const evidence = testInfo.outputPath("browser-security.json");
    await writeFile(evidence, JSON.stringify(report, null, 2));
    await testInfo.attach("browser-security.json", {
      path: evidence,
      contentType: "application/json",
    });
  }
});

test(PROBE, async ({ page, securityEvents }) => {
  // The existing root returns a local 307; the guard must not follow it.
  await expect(page.goto("/")).rejects.toThrow();
  expect(
    securityEvents.some(
      (event) => event.action === "redirect-blocked" && event.expected,
    ),
  ).toBe(true);
  await page.goto("/login");
  expect(
    await page.evaluate(async () => {
      try {
        await fetch("https://spacebook-e2e.invalid/probe");
        return true;
      } catch {
        return false;
      }
    }),
  ).toBe(false);
  const wsClosed = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        const socket = new WebSocket("wss://spacebook-e2e.invalid/probe");
        const timer = setTimeout(() => {
          socket.close();
          resolve(false);
        }, 5000);
        socket.onclose = () => {
          clearTimeout(timer);
          resolve(true);
        };
      }),
  );
  expect(wsClosed).toBe(true);
  expect(
    securityEvents
      .filter((event) => event.action === "blocked" && event.expected)
      .map((event) => event.kind)
      .sort(),
  ).toEqual(["http", "websocket"]);
});

async function login(page: Page, admin = false) {
  await page.goto("/login");
  await page
    .getByRole("button", {
      name: `Usar cuenta de ${admin ? "admin" : "usuario"}`,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL(/\/mapa$/);
  await expect(
    page.getByRole("heading", { name: "Encuentra tu próximo espacio." }),
  ).toBeVisible();
}

test("credenciales incorrectas y login de usuario; selección real del mapa y ambos pisos", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("usuario@spacehub.test");
  await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta");
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "no son correctos",
  );
  await page.screenshot({
    path: test.info().outputPath("login-escritorio.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Usar cuenta de usuario", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await page.getByTestId("room-sala-a").click();
  await expect(
    page
      .getByRole("complementary", {
        name: "Información del espacio seleccionado",
      })
      .getByRole("heading", { name: "Sala A" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Piso 2", exact: true }).click();
  await page.getByTestId("room-oficina-1").click();
  await expect(
    page.getByRole("button", { name: "No reservable", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: test.info().outputPath("mapa-piso-2.png"),
    fullPage: true,
  });
});

test("seis pantallas conectadas: detalles, confirmar, reserva persistida y cancelación", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page.screenshot({
    path: test.info().outputPath("mapa-escritorio.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Ver detalles", exact: true }).click();
  await expect(page).toHaveURL(/\/espacios\/creativa$/);
  await expect(
    page.getByRole("heading", { name: "Sala Creativa", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("detalles.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Reservar este espacio" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirma tu reservación." }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("confirmar.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Confirmar reservación", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tu espacio te espera." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Ver mis reservaciones", exact: true })
    .click();
  await expect(page).toHaveURL(/\/reservaciones$/);
  const card = page.getByRole("article").filter({
    has: page.getByRole("heading", { name: "Sala Creativa", exact: true }),
  });
  await expect(card).toContainText("Confirmada");
  await page.reload();
  await expect(card).toContainText("Confirmada");
  await page.screenshot({
    path: test.info().outputPath("reservaciones.png"),
    fullPage: true,
  });
  await card
    .getByRole("button", { name: "Cancelar reservación", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Conservar reservación" }).click();
  await expect(card).toContainText("Confirmada");
  await card
    .getByRole("button", { name: "Cancelar reservación", exact: true })
    .click();
  await page.getByRole("button", { name: "Sí, cancelar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Reservación cancelada");
  await page.getByRole("button", { name: /^Historial/ }).click();
  await expect(card).toContainText("Cancelada");
  await expect(
    card.getByRole("button", { name: "Cancelar reservación", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Mapa", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Reservar espacio", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("disponibilidad depende de fecha y hora; bloqueados y privados no reservables", async ({
  page,
}) => {
  await login(page);
  await page.getByTestId("room-sala-b").click();
  await expect(
    page.getByRole("button", { name: "No disponible", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Horario de reservación").selectOption("11");
  await expect(
    page.getByRole("link", { name: "Reservar espacio", exact: true }),
  ).toBeVisible();
  await page.getByTestId("room-estudio").click();
  await expect(
    page.getByRole("button", { name: "No disponible", exact: true }),
  ).toBeDisabled();
  await page.goto("/reservar/oficina-1");
  await expect(
    page.getByRole("button", { name: "Confirmar reservación", exact: true }),
  ).toBeDisabled();
});

test("normal no ve administración y ruta directa está protegida", async ({
  page,
}) => {
  await login(page);
  await expect(
    page.getByRole("link", { name: "Administración", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Acceso restringido" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Bloquear espacio", exact: true }),
  ).toHaveCount(0);
});

test("admin inicia sesión, habilita, bloquea, persiste y consulta reservas", async ({
  page,
}) => {
  await login(page, true);
  await page.getByRole("link", { name: "Administración", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Administración de espacios." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Habilitar espacio", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("espacio habilitado");
  await page
    .getByRole("button", { name: "Bloquear espacio", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("espacio bloqueado");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Habilitar espacio", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toContainText(
    "Usuario de demostración",
  );
  await page.screenshot({
    path: test.info().outputPath("administracion.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("mapa con teclado, búsqueda y zoom", async ({ page }) => {
  await login(page);
  const room = page.getByTestId("room-sala-a");
  await room.focus();
  await page.keyboard.press("Enter");
  await expect(room).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Acercar mapa", exact: true }).click();
  await expect(page.getByText("120%", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Restablecer vista", exact: true })
    .click();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await page.getByRole("searchbox").fill("inexistente");
  await expect(
    page.getByRole("status").filter({ hasText: "Sin coincidencias" }),
  ).toBeVisible();
});

test("móvil 390px: mapa seleccionable y flujo de reserva sin desbordamiento", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.screenshot({
    path: test.info().outputPath("login-movil.png"),
    fullPage: true,
  });
  await login(page);
  await page.getByTestId("room-sala-a").click();
  const panel = page.getByRole("complementary", {
    name: "Información del espacio seleccionado",
  });
  await expect(
    panel.getByRole("heading", { name: "Sala A", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath("mapa-movil.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await panel
    .getByRole("link", { name: "Reservar espacio", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar reservación", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tu espacio te espera." }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Ver mis reservaciones", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("dos pestañas del mismo navegador compiten por el mismo horario sin duplicarlo", async ({
  page,
  context,
}) => {
  await login(page);
  await page.goto("/reservar/creativa");
  const other = await context.newPage();
  await other.goto("/reservar/creativa");
  await expect(
    other.getByRole("button", { name: "Confirmar reservación", exact: true }),
  ).toBeEnabled();
  await Promise.all([
    page
      .getByRole("button", { name: "Confirmar reservación", exact: true })
      .click({ force: true }),
    other
      .getByRole("button", { name: "Confirmar reservación", exact: true })
      .click({ force: true }),
  ]);
  const count = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("spacebook:datos:v1")!);
    return data.reservas.filter(
      (r: { espacioId: string; hora: number; estado: string }) =>
        r.espacioId === "creativa" &&
        r.hora === 10 &&
        r.estado === "confirmada",
    ).length;
  });
  expect(count).toBe(1);
});
