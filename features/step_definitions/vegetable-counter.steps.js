// Step definitions for the Vegetable Counter application.
//
// Every Gherkin step in features/*.feature is implemented here. Steps stay
// free of UI selectors — all locators and interaction details live in the
// page object (pages/VegetableCounterPage.js), and this file only describes
// what each step does in terms of the app's behaviour.

'use strict';

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ----------------------------------------------------------------------
// Given — set up state on the page
// ----------------------------------------------------------------------

Given('I am on the Vegetable Counter page', async function () {
  await this.getPage().goto(this.baseUrl);
});

Given('I have {qty} {veg} in stock', async function (quantity, vegetable) {
  await this.getPage().enterStock(vegetable, quantity);
});

Given('I eat {qty} {veg}', async function (quantity, vegetable) {
  await this.getPage().enterEaten(vegetable, quantity);
});

Given('I enter {string} as the number of {veg} in stock', async function (text, vegetable) {
  await this.getPage().enterStock(vegetable, text);
});

Given('I enter {string} as the number of {veg} eaten', async function (text, vegetable) {
  await this.getPage().enterEaten(vegetable, text);
});

// Bulk entry from a Gherkin data table. Each row is one vegetable with its
// stock and eaten amounts; the page object fills both fields for every row.
Given('the following vegetables are in stock:', async function (dataTable) {
  const rows = dataTable.hashes();
  for (const row of rows) {
    await this.getPage().enterStock(row.vegetable, row.stock);
    await this.getPage().enterEaten(row.vegetable, row.eaten);
  }
});

// ----------------------------------------------------------------------
// When — perform an action
// ----------------------------------------------------------------------

When('I calculate the remaining vegetables', async function () {
  await this.getPage().clickCalculate();
});

When('I reset the application', async function () {
  await this.getPage().clickReset();
});

When('I change the eaten amount for {veg} to {int}', async function (vegetable, quantity) {
  await this.getPage().enterEaten(vegetable, quantity);
});

When('I change the stock amount for {veg} to {int}', async function (vegetable, quantity) {
  await this.getPage().enterStock(vegetable, quantity);
});

// ----------------------------------------------------------------------
// Then — assert the visible state of the application
// ----------------------------------------------------------------------

Then('the application should show {int} {veg} remaining', async function (expected, vegetable) {
  expect(await this.getPage().remainingFor(vegetable)).toBe(expected);
});

Then('the application should show {int} vegetables remaining in total', async function (expected) {
  expect(await this.getPage().totalRemaining()).toBe(expected);
});

Then('the total remaining should be {int}', async function (expected) {
  expect(await this.getPage().totalRemaining()).toBe(expected);
});

Then('the total should show a dash instead of a number', async function () {
  expect(await this.getPage().totalRemaining()).toBe('-');
});

Then('every quantity field should be empty', async function () {
  expect(await this.getPage().inputsAreEmpty()).toBe(true);
});

Then('I should see an error message', async function () {
  expect(await this.getPage().hasError()).toBe(true);
});

Then('I should not see an error message', async function () {
  expect(await this.getPage().hasError()).toBe(false);
});

Then('the application should warn me that I cannot eat {int} {veg} when I only have {int}',
  async function (eaten, vegetable, stock) {
    const text = await this.getPage().errorText();
    expect(text).toContain('cannot eat ' + eaten + ' ' + vegetable);
    expect(text).toContain('only have ' + stock + ' in stock');
  }
);

Then('I should see an error about the quantity for {veg}', async function (vegetable) {
  const text = await this.getPage().errorText();
  expect(text.toLowerCase()).toContain('whole, non-negative number');
  expect(text.toLowerCase()).toContain(vegetable);
});
