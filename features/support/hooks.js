// Cucumber hooks — manage the Playwright browser/page lifecycle.
//
//   Before: open one shared browser (once per run) and give every scenario
//           a fresh page on a clean cookie/storage state.
//   After:  attach a screenshot and the console log on failure, then close
//           the page. The browser stays open across scenarios for speed and
//           is torn down once, at the very end of the run.
//
// This mirrors how Playwright's own test-runner manages browser contexts
// but lets Cucumber remain the test orchestrator.

'use strict';

const fs = require('fs');
const path = require('path');
const { Before, BeforeAll, After, AfterAll } = require('@cucumber/cucumber');
const { chromium, firefox, webkit } = require('@playwright/test');

let sharedBrowser = null;

// Per-run sequence number for recordings: Scenario Outline examples share the
// same pickle name, so without a unique prefix their videos would overwrite
// each other. This counter guarantees one file per executed pickle.
let scenarioCounter = 0;

// Browser selection. "edge" drives a real installed Microsoft Edge via
// Playwright's msedge channel (Edge is Chromium-based, so it uses the
// chromium launcher with a channel override). Controlled by the BROWSER env
// var (set by scripts/run-tests.js or manually).
const BROWSERS = {
  chromium: { launcher: chromium, channel: undefined },
  edge: { launcher: chromium, channel: 'msedge' },
  firefox: { launcher: firefox, channel: undefined },
  webkit: { launcher: webkit, channel: undefined }
};

function resolveBrowser(name) {
  const key = (name || 'chromium').toLowerCase();
  if (BROWSERS[key]) return BROWSERS[key];
  console.warn(`Unknown browser "${name}" — falling back to chromium.`);
  return BROWSERS.chromium;
}

BeforeAll(async function () {
  // "headed" mode shows a real browser window so you can watch the tests run.
  // It is driven by the HEADED env var set by scripts/run-tests.js (BeforeAll
  // cannot access world parameters), so a direct `cucumber-js` call is headless
  // unless HEADED is set manually.
  const headed = process.env.HEADED === 'true';
  const { launcher, channel } = resolveBrowser(process.env.BROWSER);

  const launchOptions = {
    headless: !headed,
    // Slow the browser down slightly in headed mode so the interactions are
    // visible; keep it instant in headless mode.
    slowMo: headed ? 150 : 0,
    // Deterministic window size so screenshots and layout are stable.
    args: ['--window-size=1280,720']
  };
  // For Edge, tell the chromium launcher to use the installed Edge binary.
  if (channel) launchOptions.channel = channel;

  console.log(`Launching browser: ${channel ? channel : 'chromium'}${headed ? ' (headed)' : ' (headless)'}`);
  sharedBrowser = await launcher.launch(launchOptions);
});

Before(async function () {
  // Optional per-run video recording of every scenario. Enabled by the
  // RECORD_VIDEO env var (set by scripts/run-tests.js when --record is passed).
  // Recordings are written to reports/videos/ and kept for every scenario.
  const recording = process.env.RECORD_VIDEO === 'true';
  scenarioCounter += 1;
  this.scenarioIndex = scenarioCounter;

  const contextOptions = {
    viewport: { width: 1280, height: 720 },
    locale: 'en-US',
    timezoneId: 'UTC'
  };
  if (recording) {
    contextOptions.recordVideo = {
      dir: path.join(process.cwd(), 'reports', 'videos'),
      size: { width: 1280, height: 720 }
    };
  }

  const context = await sharedBrowser.newContext(contextOptions);
  this.browser = sharedBrowser;
  this.context = context;
  this.page = await context.newPage();

  // Capture console messages and uncaught page errors so failures carry the
  // app's own diagnostics, not just the DOM state. Collected per-scenario and
  // attached (or written to a file) if the scenario fails.
  this.consoleLog = [];
  this.pageErrors = [];
  this.page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || msg.type() === 'warning') {
      this.consoleLog.push(`[${msg.type()}] ${text}`);
    }
  });
  this.page.on('pageerror', (err) => {
    this.pageErrors.push(String(err && err.stack ? err.stack : err));
  });
});

After(async function (scenario) {
  // Keep diagnostics for failed scenarios: a screenshot plus any console
  // warnings/errors and uncaught page errors the page emitted while running.
  const failed = scenario.result && scenario.result.status === 'FAILED';
  if (failed && this.page) {
    const diagnostics = {
      consoleLog: this.consoleLog || [],
      pageErrors: this.pageErrors || []
    };
    const hasLog = diagnostics.consoleLog.length > 0 || diagnostics.pageErrors.length > 0;

    try {
      const shot = await this.page.screenshot({ type: 'png', fullPage: true });
      if (typeof this.attach === 'function') {
        await this.attach(shot, 'image/png');
        if (hasLog) {
          await this.attach(JSON.stringify(diagnostics, null, 2), 'text/plain');
        }
      } else {
        // Some Cucumber versions do not expose this.attach inside hooks;
        // fall back to writing the screenshot and log to files so we never
        // lose failure diagnostics.
        const dir = path.join(process.cwd(), 'reports', 'failure-screenshots');
        fs.mkdirSync(dir, { recursive: true });
        const safeName = (scenario.pickle && scenario.pickle.name
          ? scenario.pickle.name.replace(/[^a-z0-9]+/gi, '_')
          : 'failure') + '.png';
        fs.writeFileSync(path.join(dir, safeName), shot);
        if (hasLog) {
          fs.writeFileSync(
            path.join(dir, safeName.replace(/\.png$/, '.log.txt')),
            JSON.stringify(diagnostics, null, 2)
          );
        }
      }
    } catch (err) {
      console.warn('Could not capture failure diagnostics:', err.message);
    }
  }
  // Video recording: read the recording's source path while the page is still
  // live, then close the context — Playwright only finalises the .webm file on
  // context close. After that we move it to a scenario-named file.
  // (page.video().saveAs() hangs on this Playwright version, so we use
  // path()+rename instead.)
  let videoSrc = null;
  const video = this.page ? this.page.video() : null;
  if (video) {
    try {
      videoSrc = await video.path();
    } catch (err) {
      console.warn('Could not read video path:', err.message);
    }
  }

  if (this.page) {
    await this.page.close();
    this.page = null;
  }
  if (this.context) {
    await this.context.close();
    this.context = null;
  }

  if (videoSrc) {
    try {
      const name = String(this.scenarioIndex || 0).padStart(3, '0') + '_' +
        (scenario.pickle && scenario.pickle.name
          ? scenario.pickle.name.replace(/[^a-z0-9]+/gi, '_')
          : 'scenario') + '.webm';
      const dest = path.join(process.cwd(), 'reports', 'videos', name);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (fs.existsSync(videoSrc)) {
        fs.renameSync(videoSrc, dest);
      }
    } catch (err) {
      console.warn('Could not save video recording:', err.message);
    }
  }

  this.consoleLog = [];
  this.pageErrors = [];
  this.vegetableCounter = null;
});

AfterAll(async function () {
  if (sharedBrowser) {
    await sharedBrowser.close();
    sharedBrowser = null;
  }
});
