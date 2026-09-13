// Test runner: starts the Vegetable Counter app, runs the Cucumber suite,
// then shuts the app down — all in one command so `npm test` is fully
// self-contained and cannot fail with "connection refused".
//
// Behaviour:
//   1. If the app is already serving on BASE_URL (someone ran `npm run app`
//      in another terminal), reuse it and leave it running.
//   2. Otherwise start app/server.js on a background port, wait until it
//      responds, run Cucumber, then stop the server.
//   3. Propagate Cucumber's exit code so CI / scripts see failures.

'use strict';

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';
const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`;
const SERVER_JS = path.join(__dirname, '..', 'app', 'server.js');

const CUCUMBER_JS = path.join(
  __dirname,
  '..',
  'node_modules',
  '@cucumber',
  'cucumber',
  'bin',
  'cucumber.js'
);

const VALID_BROWSERS = ['chromium', 'edge', 'firefox', 'webkit'];

// Read a --flag value from the CLI, falling back to an env var, then a default.
// Supports both "--flag value" and "--flag=value" forms.
function flagValue(name, envName, fallback) {
  const equals = '--' + name + '=';
  const eqArg = process.argv.find((a) => a.startsWith(equals));
  if (eqArg) return eqArg.slice(equals.length);
  const idx = process.argv.indexOf('--' + name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return process.env[envName] || fallback;
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', reject);
    req.setTimeout(700, () => {
      req.destroy(new Error('timeout'));
    });
  });
}

async function isServing(url, attempts = 25, delayMs = 250) {
  for (let i = 0; i < attempts; i++) {
    try {
      await request(url);
      return true;
    } catch (err) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return false;
}

async function main() {
  // Strip any trailing slashes: the page object appends '/' itself, so a
  // trailing slash here would produce a "//" URL (a 500 page with no app UI).
  const baseUrl = BASE_URL.replace(/\/+$/, '');
  let serverProc = null;
  let exitCode = 1;

  console.log(`\n== Vegetable Counter BDD suite ==`);
  console.log(`Target: ${baseUrl}`);

  // Browser selection (--browser <name> | BROWSER env | default chromium).
  let browser = flagValue('browser', 'BROWSER', 'chromium').toLowerCase();
  if (!VALID_BROWSERS.includes(browser)) {
    console.warn(`Unknown browser "${browser}" — using chromium.`);
    browser = 'chromium';
  }
  process.env.BROWSER = browser; // forwarded to the cucumber child -> hooks.js
  console.log(`Browser: ${browser}`);

  // Optional video recording of the run. Enabled by --record (or RECORD_VIDEO=true).
  // Forwarded to the cucumber child -> hooks.js, which saves a .webm per scenario.
  const record = process.argv.includes('--record') || process.env.RECORD_VIDEO === 'true';
  process.env.RECORD_VIDEO = record ? 'true' : 'false';
  console.log(`Recording: ${record ? 'on (reports/videos)' : 'off'}`);

  // Try to reuse an already-running instance.
  if (await isServing(baseUrl, 1, 0)) {
    console.log(`App already running at ${baseUrl} — reusing it (will not stop it).`);
  } else {
    console.log(`Starting the app (node ${SERVER_JS}) ...`);
    serverProc = spawn(process.execPath, [SERVER_JS], {
      stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env, PORT: String(PORT), HOST }
    });

    if (!(await isServing(baseUrl))) {
      console.error(`\nFailed to start the app at ${baseUrl}. Check app/server.js and port ${PORT}.`);
      if (serverProc) serverProc.kill();
      process.exit(1);
    }
    console.log(`App is up at ${baseUrl}.`);
  }

  try {
    const args = ['--format', 'progress-bar'];

    // Optional Cucumber tag expression (--tags "@smoke" | TAGS env) so subset
    // runs via this wrapper (npm run test:smoke) behave exactly like direct
    // cucumber-js calls, but with the app guaranteed to be up: this script
    // starts the server, and features/support/app-server.js reuses it.
    const tagsArg = flagValue('tags', 'TAGS', '');
    if (tagsArg) args.push('--tags', tagsArg);

    if (process.argv.includes('--headed')) {
      args.push('--world-parameters', JSON.stringify({ headed: true }));
      // Expose headed mode via env so the BeforeAll hook (which cannot see
      // world parameters) can launch a visible browser.
      process.env.HEADED = 'true';
    }

    const cucumber = spawn(process.execPath, [CUCUMBER_JS, ...args], {
      stdio: 'inherit',
      env: { ...process.env, BASE_URL: baseUrl }
    });

    exitCode = await new Promise((resolve) => {
      cucumber.on('close', resolve);
      cucumber.on('error', (err) => {
        console.error('Failed to run cucumber-js:', err.message);
        resolve(1);
      });
    });
  } finally {
    if (serverProc) {
      console.log('\nStopping the app server ...');
      serverProc.kill();
    }
  }

  console.log(`\nCucumber exit code: ${exitCode}`);
  process.exit(exitCode);
}

main().catch((err) => {
  console.error('Unexpected runner error:', err);
  process.exit(1);
});
