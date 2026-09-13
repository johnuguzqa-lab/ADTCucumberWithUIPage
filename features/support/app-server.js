// Guarantee the Vegetable Counter app is reachable before scenarios run.
//
// Why this file exists:
//   `cucumber-js` only runs the browser suite against whatever is already
//   listening on BASE_URL (default http://127.0.0.1:8080) — it does NOT start
//   the web app. `npm test` hides that by starting the server itself
//   (scripts/run-tests.js), but a direct call such as
//
//       npx cucumber-js --tags "@smoke"
//
//   fails every scenario with `net::ERR_CONNECTION_REFUSED` when the app is
//   not up. This module gives direct cucumber-js runs the same guarantee that
//   scripts/run-tests.js gives `npm test`:
//
//     - if an app is already serving BASE_URL  -> reuse it (leave it running)
//     - otherwise start app/server.js for this run, wait for it to respond,
//       and stop it again when the run finishes (AfterAll / process exit)
//
//   If the app cannot be started, the suite fails fast with a clear message
//   instead of every scenario drowning in connection-refused errors.

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { BeforeAll, AfterAll } = require('@cucumber/cucumber');

// Same default as cucumber.js and features/support/world.js.
const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '');
const STARTUP_TIMEOUT_MS = 20000;
const POLL_INTERVAL_MS = 250;
const SERVER_JS = path.join(__dirname, '..', '..', 'app', 'server.js');

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

// Non-null only when THIS module started the server for the current run.
let managedServer = null;
let spawnError = null;

async function isServing() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      // Any HTTP response (even 4xx/5xx) means something is listening.
      await fetch(BASE_URL + '/', { signal: controller.signal });
      return true;
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    return false;
  }
}

function stopManagedServer() {
  if (managedServer) {
    managedServer.kill();
    managedServer = null;
    spawnError = null;
  }
}

async function waitUntilServing(deadline) {
  for (;;) {
    if (await isServing()) return true;
    if (Date.now() >= deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

async function ensureAppIsRunning() {
  // Something is already serving the base URL (started by scripts/run-tests.js,
  // `npm run app`, the logon task, CI, ...) -> reuse it, do not touch it.
  if (await isServing()) {
    console.log(`Reusing the app already running at ${BASE_URL}.`);
    return;
  }

  // Only auto-start when the base URL points at this machine.
  const { hostname, port } = new URL(BASE_URL);
  if (!LOCAL_HOSTS.has(hostname)) {
    throw new Error(
      `No app is responding at ${BASE_URL} and it is not a local address, so it cannot be ` +
        'started automatically. Start it yourself (e.g. `npm run app`) or fix BASE_URL.'
    );
  }

  console.log(`No app found at ${BASE_URL} — starting app/server.js for this run ...`);
  managedServer = spawn(process.execPath, [SERVER_JS], {
    stdio: 'ignore',
    env: { ...process.env, HOST: hostname, PORT: port || '80' }
  });
  managedServer.on('error', (err) => {
    spawnError = err;
  });

  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  if (await waitUntilServing(deadline)) {
    console.log(`App is up at ${BASE_URL} (auto-started; stopped at the end of the run).`);
    return;
  }

  const detail = spawnError ? ` (${spawnError.message})` : '';
  stopManagedServer();
  throw new Error(
    `Could not start the Vegetable Counter app at ${BASE_URL} within ` +
      `${STARTUP_TIMEOUT_MS / 1000}s${detail}. Start it manually with \`npm run app\` ` +
      '(or point BASE_URL at an instance that is already running) and re-run.'
  );
}

// Run before the browser is launched / scenarios execute so every direct
// cucumber-js call behaves like `npm test` does (app guaranteed to be up).
BeforeAll({ timeout: STARTUP_TIMEOUT_MS + 5000 }, ensureAppIsRunning);

// If we started the server for this run, stop it again once the suite ends.
AfterAll(async function () {
  if (managedServer) {
    console.log('Stopping the app server that was started for this run ...');
    stopManagedServer();
  }
});

// Backstop for hard aborts so a run never leaves an orphan server behind.
process.on('exit', stopManagedServer);
