# Vegetable Counter — Cucumber BDD Test Suite

Behaviour-driven end-to-end tests for the **Vegetable Counter** web
application, written with **Cucumber.js** (Gherkin) and driven by
**Playwright** against a real browser.

The suite validates the five required functional scenarios plus six
additional meaningful scenarios (rationale below), and ships with the
small reference web app it tests so the whole thing runs from a clean
checkout.

---

## Table of contents

- [What is being tested](#what-is-being-tested)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the tests](#running-the-tests)
  - [Starting the app](#starting-the-app)
  - [Running the suite](#running-the-suite)
  - [Running a subset](#running-a-subset)
- [The scenarios](#the-scenarios)
  - [Required scenarios](#required-scenarios)
  - [Additional scenarios and their rationale](#additional-scenarios-and-their-rationale)
- [How it works](#how-it-works)
- [Assumptions and trade-offs](#assumptions-and-trade-offs)

---

## What is being tested

The Vegetable Counter is a page where a user enters, for several
vegetables, how many they **have in stock** and how many they **ate**. The
application then computes and displays:

- how many of each vegetable **remain** (`stock − eaten`), and
- the **total** number of vegetables remaining (sum of all the above).

Validation rules enforced by the app:

1. Quantities must be whole, non-negative numbers.
2. A vegetable is only counted when a stock quantity is provided for it.
3. You cannot eat more of a vegetable than you have in stock.
4. Reset clears every input, the error message and the results.

The application itself lives in [`app/`](./app) and is served by a tiny
zero-dependency Node server (`node app/server.js`).

---

## Project structure

```
.
├── app/                        # The Vegetable Counter reference web app
│   ├── index.html              # Page markup (data-testid locators)
│   ├── app.js                  # Business logic + DOM wiring
│   ├── styles.css              # Styling
│   └── server.js               # Tiny static HTTP server (no deps)
├── features/                   # Gherkin specifications
│   ├── cucumbers.feature
│   ├── carrots.feature
│   ├── multiple-vegetables.feature
│   ├── invalid-quantity.feature
│   ├── reset.feature
│   ├── additional-scenarios.feature
│   ├── support/
│   │   ├── world.js            # Custom Cucumber World (page, baseUrl, state)
│   │   ├── hooks.js            # Browser / page lifecycle + failure screenshots
│   │   └── parameters.js       # Custom parameter types ({veg}, {qty})
│   └── step_definitions/
│       └── vegetable-counter.steps.js
├── pages/
│   └── VegetableCounterPage.js # Page object: all selectors & interactions
├── scripts/
│   ├── run-tests.js            # Test runner: starts/stops the app around the suite
│   └── start-app.bat           # Idempotent app starter (used by the auto-start task)
├── cucumber.js                 # Cucumber runner configuration
├── playwright.config.js        # Shared Playwright options (browser, timeouts)
├── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18 (developed and verified on Node v24.x)
- **npm** ≥ 9
- An internet connection on first install (to download dependencies and the
  Chromium browser binary)

Check your versions:

```bash
node --version
npm --version
```

---

## Installation

```bash
npm install
```

The `postinstall` script downloads the Chromium browser used by Playwright
automatically. If it is skipped or fails, install the browser manually:

```bash
npx playwright install chromium
```

---

## Running the tests

`npm test` is fully self-contained: it **automatically starts** the Vegetable
Counter app on port 8080, runs the suite, then shuts the app down. You do not
need to start the app yourself.

```bash
npm test
```

If the app is already running (e.g. you started it with `npm run app` in
another terminal), the runner detects it and reuses that instance instead of
starting a second one — and it will *not* shut down a pre-existing server.

Headless by default (no window). To **watch the tests run in a visible
browser window**, run in headed mode:

```bash
npm run test:headed
```

Headed mode launches a real browser window, adds a small delay between
actions so you can follow along, then closes it when the run finishes. (It is
slightly slower than headless for this reason.)

### Choosing a browser

The suite runs in **Chromium** by default. You can also run it in a real
installed **Microsoft Edge** (or Firefox/WebKit if you have the Playwright
browsers installed) via the `--browser` flag:

```bash
npm run test:edge                 # Edge, headless
npm run test:edge:headed          # Edge, visible window
npm test -- --browser firefox     # any supported browser, headless
```

The `BROWSER` environment variable works too (e.g. `$env:BROWSER='edge'; npm test`).
Supported names: `chromium` (default), `edge`, `firefox`, `webkit`.

> **Note on Edge:** Edge uses the `msedge` channel, which drives the Edge that
> is already installed on your machine — no extra browser download needed.
> Firefox/WebKit require their Playwright builds (`npx playwright install firefox webkit`).

### Starting the app manually (optional)

You only need this if you want to serve the app yourself and keep it running
between test runs (defaults to `http://127.0.0.1:8080`):

```bash
npm run app
# or:  node app/server.js [port]
```

You can serve the app on another port; point the runner at it with `BASE_URL`:

```bash
$env:PORT='9090'; npm run app        # terminal 1 — serve on 9090
$env:BASE_URL='http://127.0.0.1:9090'; npm test   # terminal 2 — test against it
```

### Auto-start on Windows boot

A Windows Scheduled Task named **`VegetableCounterApp`** starts the app
automatically at logon, so `http://127.0.0.1:8080` is available whenever you
log in. It runs `scripts/start-app.bat`, which is idempotent — if the app is
already running it does nothing (no duplicate servers). Activity is logged to
`app-autostart.log`.

Useful commands:

```powershell
# See the task / its last run result
Get-ScheduledTask -TaskName 'VegetableCounterApp'
Get-ScheduledTaskInfo -TaskName 'VegetableCounterApp'

# Stop auto-starting on logon (deletes the task)
Unregister-ScheduledTask -TaskName 'VegetableCounterApp' -Confirm:$false

# Stop a running instance right now
Get-NetTCPConnection -LocalPort 8080 | ForEach-Object { Stop-Process -Id $_.OwningProcess }
```

The run writes reports to `reports/`:

- `reports/cucumber-report.html` — human-readable HTML report
- `reports/cucumber-report.json` — machine-readable JSON report

### Running a subset

Run scenarios tagged `@smoke` (the core required flows) with retry-once
behaviour:

```bash
npx cucumber-js --tags "@smoke"
```

Run a single feature file:

```bash
npx cucumber-js features/cucumbers.feature
```

Dry-run (validate that every Gherkin step has a matching definition,
without launching a browser):

```bash
npm run test:dry
```

> **Tip:** `cucumber.js` reads `BASE_URL` (default `http://127.0.0.1:8080`)
> and `HEADED` from the environment, so the same suite runs in CI headless
> or locally headed without code changes.

---

## The scenarios

### Required scenarios

| Feature file | Scenario | Behaviour validated |
| --- | --- | --- |
| `cucumbers.feature` | Show how many cucumbers remain after eating some | 5 in stock − 3 eaten → **2 cucumbers** remain |
| `carrots.feature` | Show how many carrots remain after eating some | 10 in stock − 3 eaten → **7 carrots** remain |
| `multiple-vegetables.feature` | Track several vegetables and show the combined total | 8 cucumbers + 5 carrots; eat 3 + 2 → **5 cucumbers, 3 carrots, 8 total** |
| `invalid-quantity.feature` | Eating more than what is in stock is rejected | 2 in stock, eat 3 → clear **error**, total shows `-` |
| `reset.feature` | Reset returns the application to its initial state | After a calculation, **Reset** empties every field and totals return to **0** |

### Additional scenarios and their rationale

All six live in `features/additional-scenarios.feature`. They pin down
behaviour that is easy to break and that the required list does not cover
explicitly:

1. **An empty form produces zeros, not an error** — pressing *Calculate*
   with no data must give `0` remaining, not a confusing error. Guards the
   default/empty state.
2. **Non-numeric stock is rejected** — typing `abc` must be rejected with a
   clear message instead of silently producing `NaN`. Guards input
   validation.
3. **Negative eaten quantity is rejected** — typing `-2` is rejected;
   negative quantities are meaningless for a counter. Guards validation of
   the eaten field specifically.
4. **Eating your entire stock leaves zero** — the boundary case of eating
   exactly all you have must land on `0` (not an error, not `-1`). Guards
   the arithmetic boundary.
5. **Recalculating replaces, not accumulates, the previous result** — a
   second *Calculate* with changed inputs must **replace** the previous
   result (`5 − 3 → 2`, then change to `5 − 4 → 1`, never `2 + 1`). Guards
   against state leaking between calculations.
6. **A fixed error clears and shows the correct result** — after an error,
   correcting the input and recalculating must clear the error and show the
   right numbers. Guards the error-recovery path.

These were chosen because each maps to a distinct class of regression a
developer could easily introduce (default state, validation, boundaries,
statelessness, recovery) while keeping the suite fast and deterministic.

---

## How it works

- **Cucumber.js** parses the `.feature` files and runs each scenario.
- **Custom World** (`features/support/world.js`) carries the Playwright
  page, the page object, and the configured `baseUrl` into every step.
- **Hooks** (`features/support/hooks.js`) launch one shared Chromium
  browser for the whole run, give each scenario a clean page/context, and
  attach a full-page screenshot to any failing scenario.
- **Page object** (`pages/VegetableCounterPage.js`) is the only place that
  knows about selectors (`data-testid` attributes). Step definitions only
  express behaviour.
- **Custom parameter types** (`{veg}`, `{qty}`) let features read naturally
  (e.g. `1 cucumber` and `cucumbers` both map to the same vegetable id).

---

## Assumptions and trade-offs

- **The app was not present in the workspace**, so this repository includes
  a reference implementation under `app/` implementing the stated
  requirements (`stock − eaten`, total, validation, reset). If the real
  Vegetable Counter app is provided later, the page object
  (`pages/VegetableCounterPage.js`) is the only file that should need to
  change to point at the real selectors — the feature files and step
  definitions are intentionally selector-free.
- **One shared browser across scenarios** for speed, with a fresh page per
  scenario. This is a deliberate speed/robustness trade-off: state cannot
  leak between scenarios because each gets a brand-new Playwright context.
- **`data-testid` attributes** are used for locators. They are more robust
  than CSS classes or visible text, and they are explicitly not user-facing
  so they can change freely. If the real app does not expose them, update
  the page object's locators accordingly.
- **Headless Chromium** by default (fast, CI-friendly); run headed with
  `npm run test:headed`.
- **Fixed viewport (1280×720)** and locale (`en-US`) make screenshots and
  text assertions deterministic across machines.
- **`@smoke` tag** is applied to the core cucumber scenario and configured
  to retry once (`retryTagFilter`) — a signal for a flaky core without
  hiding genuine breakage. The rest of the suite does not retry.
- **Port 8080** is the default for both the app server and `BASE_URL`.
  Change both consistently if you use a different port.
- The `app/` server binds to `127.0.0.1` only — it is for local testing, not
  production.


