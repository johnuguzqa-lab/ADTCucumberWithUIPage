// Cucumber.js configuration (CommonJS module)
//
// - retryTagFilter + retry: re-run just the smoke-tagged scenarios once on
//   failure. Flaky single re-runs give a flaky-suite signal without
//   silently hiding real breakage. The rest of the suite never retries.
// - format: pretty console output plus an HTML report and a JSON report
//   that can be consumed by other tooling / CI dashboards.
// - worldParameters: arbitrary data forwarded to each World instance
//   (see features/support/world.js). "baseUrl" and "headed" are read from
//   environment variables so the same suite runs headless in CI and headed
//   locally with a visible browser.
module.exports = {
  default: {
    require: [
      'features/support/*.js',
      'features/step_definitions/*.js'
    ],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    retry: 1,
    retryTagFilter: '@smoke',
    worldParameters: {
      baseUrl: process.env.BASE_URL || 'http://127.0.0.1:8080',
      headed: process.env.HEADED === 'true'
    }
  }
};
