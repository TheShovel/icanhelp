# Playwright

## Overview

Playwright is a browser automation framework by Microsoft. Supports **Chromium, Firefox, WebKit** with a single API. Enables cross-browser tests, end-to-end testing, scraping, and automation. Auto-waits for elements, network idle, and assertions — no manual `waitForTimeout` needed.

## Installation

```bash
npm init playwright@latest         # interactive setup
npx playwright install             # download browser binaries
npx playwright install-deps        # system deps (Linux)
npm install @playwright/test       # test runner
```

Browsers install to `~/.cache/ms-playwright/`. Pin browser version per project.

## Core Concepts

- **Browser**: Chromium, Firefox, or WebKit instance
- **BrowserContext**: isolated session (cookies, storage, permissions) — like incognito
- **Page**: single tab or popup. `context.newPage()` creates a page within a context.
- **Locator**: auto-waiting element reference; best practice over `page.$()` / `page.$$()`

```ts
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
await page.goto("https://example.com");
await browser.close();
```

## Locators

Playwright's auto-waiting locators retry until the element is actionable.

```ts
page.locator("button#submit");                    // CSS
page.getByRole("button", { name: /submit/i });    // ARIA role
page.getByText("Welcome back");                   // text content
page.getByLabel("Email");                         // associated label
page.getByPlaceholder("user@example.com");         // placeholder attr
page.getByTestId("login-form");                   // data-testid attribute
page.locator('[data-pw="item"]');                 // custom attrs
page.locator("div").filter({ hasText: "hello" }); // chaining
```

Chainable: `page.locator("ul").locator("li").first()`, `.last()`, `.nth(2)`, `.all()`.

## Actions (Auto-Waiting)

```ts
await page.goto(url, { waitUntil: "networkidle" });
await page.click("#btn");              // waits for visible, enabled, stable
await page.fill("#input", "text");     // clears + types
await page.type("#input", "slow", { delay: 100 });
await page.selectOption("#select", "value");
await page.check("#checkbox");
await page.setInputFiles("#upload", "file.pdf");
await page.keyboard.press("Enter");
await page.mouse.click(100, 200);
```

- Auto-wait checks: visible, enabled, not detached, not animated (stable)
- Timeout: default 30s per action. Override with `{ timeout: 5000 }`.

## Assertions

Built-in retrying assertions (polls until pass or timeout):

```ts
await expect(page).toHaveTitle("Dashboard");
await expect(page.getByText("Saved")).toBeVisible();
await expect(locator).toBeEnabled();
await expect(locator).toHaveValue("test");
await expect(locator).toHaveText(/partial match/);
await expect(page.locator("li")).toHaveCount(5);
await expect(locator).toHaveClass(/active/);
await expect(page).toHaveURL(/\/dashboard/);
await expect(page.getByRole("list")).not.toBeEmpty();
```

Use `expect.poll()` for custom async assertions.

## Test Runner

```ts
// tests/example.spec.ts
import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Hello")).toBeVisible();
});

test.describe("User flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });
  test("login succeeds", async ({ page }) => { ... });
});
```

- `test.only`, `test.skip`, `test.fixme`, `test.fail`
- `test.use({ ... })` to set context options per test/describe block
- Fixtures: built-in `page`, `context`, `browser`, `request`; custom via `test.extend()`

## Playwright Config

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",        // trace viewer capture
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
});
```

## Parallel Execution

- **Fully parallel**: `fullyParallel: true` — tests within each file run in parallel
- **Workers**: `workers: 4` — number of OS processes
- **Sharding**: `npx playwright test --shard=1/3` for CI splitting
- **Serial mode**: `test.describe.serial` — sequential tests inside describe

## Codegen (Test Generator)

```bash
npx playwright codegen            # record actions + generate locators
npx playwright codegen --viewport-size=411,823  # mobile emulation
```

Opens two windows: browser + Playwright Inspector. Click actions record as test code. Copy-paste into test files. Generates resilient locators (role-based).

## Trace Viewer

```bash
npx playwright show-trace trace.zip
```

Captures: DOM snapshots, network logs, console, source map, timings. Enabled via `trace: "on"` in config or per test:

```ts
await page.context().tracing.start({ screenshots: true, snapshots: true });
await page.context().tracing.stop({ path: "trace.zip" });
```

## API Testing

Built-in `request` fixture for HTTP testing without a browser:

```ts
test("API returns data", async ({ request }) => {
  const res = await request.get("/api/users", { params: { limit: 10 } });
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toHaveLength(10);
});
```

`request` fixture auto-uses `baseURL` from config.

## Mocking & Interception

```ts
// Route interception
await page.route("**/api/users", (route) => {
  route.fulfill({ status: 200, body: JSON.stringify([{ id: 1 }]) });
});

// Block resources
await page.route("**/*.{png,jpg}", (route) => route.abort());

// Wait for request/response
const res = await page.waitForResponse("**/api/save");
```

## Emulation & Device Profiles

```ts
test.use({
  viewport: { width: 375, height: 812 },
  userAgent: "Mozilla/5.0 (iPhone; ...)",
  locale: "de-DE",
  timezoneId: "Europe/Berlin",
  colorScheme: "dark",
  geolocation: { longitude: 13.4, latitude: 52.5 },
  permissions: ["geolocation"],
});

// Built-in devices
import { devices } from "@playwright/test";
test.use(devices["iPhone 13 Pro Max"]);
```

## Network & Performance

- `page.on("request", req => ...)` / `page.on("response", res => ...)`
- `page.on("console", msg => ...)` / `page.on("pageerror", err => ...)`
- Performance metrics: `page.metrics()` (JS heap, DOM nodes, layout duration)
- WebSocket: `page.routeWebSocket(url, handler)` — intercept WS messages

## Authentication (Storage State)

```ts
// Setup: save auth state
test("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#user", "alice");
  await page.fill("#pass", "secret");
  await page.click("button");
  await page.context().storageState({ path: "auth.json" });
});

// Reuse across tests
test.use({ storageState: "auth.json" });
```

## CI Integration

```bash
npx playwright test               # run all
npx playwright test --grep "@smoke" --project chromium
npx playwright test --reporter=junit  # JUnit XML

# HTML report
npx playwright show-report
```

- Docker image: `mcr.microsoft.com/playwright:v1.52.0-focal`
- No browser install needed in Docker (baked in)

## vs Cypress

| Playwright | Cypress |
|------------|---------|
| Chromium, Firefox, WebKit | Chromium only (WebKit experimental) |
| Multi-tab / multi-domain | Single-origin limitation |
| Native event dispatch | Iframe-injected automation |
| Language: TS/JS, Python, Java, .NET | Only JS/TS |
| No iframe restriction | Cannot navigate outside baseUrl |
| `page.route()` for network mock | `cy.intercept()` |
| Trace viewer for debugging | Screenshot + video |
| Parallel in free tier (workers) | Parallel requires Cypress Cloud |
| CI-focused out-of-the-box | Dashboard for recording |
| No automatic waiting for XHR/fetch | `cy.wait()` for XHR explicit |

## Debugging & Tooling

- `npx playwright test --debug` — opens Inspector (step through, pause, pick locator)
- `await page.pause()` — manual breakpoint with inspector
- `page.screenshot({ path: "debug.png" })` — full or element screenshot
- `page.pdf({ path: "page.pdf" })` — Chromium-only PDF export
- `page.evaluate(() => document.title)` — run in page context
