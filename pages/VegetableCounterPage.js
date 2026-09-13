// Page object for the Vegetable Counter application.
//
// Centralises every locator and interaction used by the step definitions so
// that UI selectors live in exactly one place. If the application's markup
// changes, this file (and only this file) needs updating.
//
// The page object is intentionally thin and imperative: it exposes
// high-level operations ("enter stock", "read remaining") and leaves all
// Cucumber/Gherkin concerns to the step definitions layer.

'use strict';

class VegetableCounterPage {
  /**
   * @param {import('@playwright/test').Page} page A live Playwright page.
   */
  constructor(page) {
    this.page = page;
  }

  // ------------------------------------------------------------------
  // Locators
  // ------------------------------------------------------------------

  stockInput(vegetable) {
    return this.page.locator(`[data-testid="stock-${vegetable}"]`);
  }

  eatenInput(vegetable) {
    return this.page.locator(`[data-testid="eaten-${vegetable}"]`);
  }

  resultCell(vegetable) {
    return this.page.locator(`[data-testid="result-${vegetable}"]`);
  }

  totalCell() {
    return this.page.locator('[data-testid="result-total"]');
  }

  errorMessage() {
    return this.page.locator('[data-testid="error-message"]');
  }

  calculateButton() {
    return this.page.locator('[data-testid="calculate"]');
  }

  resetButton() {
    return this.page.locator('[data-testid="reset"]');
  }

  // ------------------------------------------------------------------
  // Navigation
  // ------------------------------------------------------------------

  async goto(baseUrl) {
    await this.page.goto(baseUrl + '/', { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('[data-testid="calculate"]');
  }

  // ------------------------------------------------------------------
  // Interactions
  // ------------------------------------------------------------------

  /**
   * Enter a quantity into the "in stock" field for a vegetable.
   * @param {string} vegetable vegetable id (e.g. "cucumbers")
   * @param {string|number} value
   */
  async enterStock(vegetable, value) {
    await this.stockInput(vegetable).fill(String(value));
  }

  /**
   * Enter a quantity into the "eaten" field for a vegetable.
   * @param {string} vegetable vegetable id (e.g. "cucumbers")
   * @param {string|number} value
   */
  async enterEaten(vegetable, value) {
    await this.eatenInput(vegetable).fill(String(value));
  }

  async clickCalculate() {
    await this.calculateButton().click();
  }

  async clickReset() {
    await this.resetButton().click();
  }

  // ------------------------------------------------------------------
  // Reads / assertions
  // ------------------------------------------------------------------

  async remainingFor(vegetable) {
    const text = (await this.resultCell(vegetable).innerText()).trim();
    return Number(text);
  }

  async totalRemaining() {
    const text = (await this.totalCell().innerText()).trim();
    return text === '-' ? '-' : Number(text);
  }

  async hasError() {
    const locator = this.errorMessage();
    return (await locator.isVisible()) && (await locator.innerText()).trim() !== '';
  }

  async errorText() {
    const locator = this.errorMessage();
    return (await locator.innerText()).trim();
  }

  async inputsAreEmpty() {
    for (const vegetable of ['cucumbers', 'carrots', 'tomatoes', 'peppers']) {
      for (const field of ['stock', 'eaten']) {
        const value = await this.page
          .locator(`[data-testid="${field}-${vegetable}"]`)
          .inputValue();
        if (value.trim() !== '') return false;
      }
    }
    return true;
  }
}

module.exports = { VegetableCounterPage };
