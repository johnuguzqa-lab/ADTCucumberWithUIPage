// Custom Cucumber World.
//
// Each Cucumber scenario gets a fresh World instance. We bundle the pieces
// the step definitions need:
//   - this.page        -> the shared Playwright Page (opened by hooks.js)
//   - this.vegetableCounter -> the VegetableCounterPage page object
//   - this.baseUrl     -> where the app is served (from worldParameters)
//   - this.context     -> arbitrary scenario-local state for steps
//
// Playwright's browser/page lifecycle is managed in hooks.js; nothing here
// launches or closes browsers.

'use strict';

const { setWorldConstructor } = require('@cucumber/cucumber');
const { VegetableCounterPage } = require('../../pages/VegetableCounterPage');

class VegetableCounterWorld {
  constructor({ parameters }) {
    this.parameters = parameters || {};
    this.baseUrl = this.parameters.baseUrl || process.env.BASE_URL || 'http://127.0.0.1:8080';
    this.headed = Boolean(this.parameters.headed);
    this.page = null;
    this.browser = null;
    this.context = {};
  }

  /**
   * Lazily creates the page object against this.page.
   * Step definitions should call this.getPage() rather than reaching for
   * the page object directly.
   */
  getPage() {
    if (!this.page) {
      throw new Error('No Playwright Page available — browser lifecycle is managed by the Before/After hooks.');
    }
    if (!this.vegetableCounter) {
      this.vegetableCounter = new VegetableCounterPage(this.page);
    }
    return this.vegetableCounter;
  }
}

setWorldConstructor(VegetableCounterWorld);
