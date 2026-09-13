// Vegetable Counter — application logic.
//
// This is the reference implementation the Cucumber/Playwright suite
// validates. All business rules live here so they can be reasoned about
// in one place:
//
//   1. Quantities must be whole, non-negative numbers.
//   2. A vegetable is only counted if a stock quantity is provided.
//   3. You cannot eat more of a vegetable than you have in stock.
//   4. Remaining per vegetable  = stock - eaten.
//   5. Total remaining          = sum of all per-vegetable remaining.
//   6. Reset clears every input, the error message and the results.

'use strict';

(function () {
  const VEGETABLES = [
    { id: 'cucumbers', label: 'Cucumbers' },
    { id: 'carrots', label: 'Carrots' },
    { id: 'tomatoes', label: 'Tomatoes' },
    { id: 'peppers', label: 'Peppers' }
  ];

  const resultCells = {
    cucumbers: document.querySelector('[data-testid="result-cucumbers"]'),
    carrots: document.querySelector('[data-testid="result-carrots"]'),
    tomatoes: document.querySelector('[data-testid="result-tomatoes"]'),
    peppers: document.querySelector('[data-testid="result-peppers"]'),
    total: document.querySelector('[data-testid="result-total"]')
  };

  const errorEl = document.querySelector('[data-testid="error-message"]');

  function inputFor(vegId, field) {
    return document.querySelector('[data-testid="' + field + '-' + vegId + '"]');
  }

  /**
   * Parse a quantity field.
   * @returns {{provided: boolean, valid: boolean, value: number|null}}
   *   - provided: the user typed something (empty string => false)
   *   - valid:    the text is a whole, non-negative integer
   *   - value:    the parsed integer when valid, otherwise null
   * Distinguishing "empty" from "invalid" is essential: a blank field means
   * "no data for this vegetable", while a non-numeric or negative entry is a
   * user error that must be reported.
   */
  function parseQuantity(raw) {
    const value = (raw || '').trim();
    if (value === '') return { provided: false, valid: true, value: null };
    if (!/^\d+$/.test(value)) return { provided: true, valid: false, value: null };
    return { provided: true, valid: true, value: parseInt(value, 10) };
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function clearError() {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }

  function setResult(vegId, value) {
    resultCells[vegId].textContent = String(value);
  }

  function setTotal(value) {
    resultCells.total.textContent = String(value);
  }

  function calculate() {
    clearError();

    const stock = {};
    const eaten = {};
    const errors = [];

    for (const veg of VEGETABLES) {
      const s = parseQuantity(inputFor(veg.id, 'stock').value);
      const e = parseQuantity(inputFor(veg.id, 'eaten').value);

      // Nothing entered for this vegetable -> ignore it (contributes 0).
      if (!s.provided && !e.provided) {
        stock[veg.id] = 0;
        eaten[veg.id] = 0;
        continue;
      }

      // Invalid (non-numeric / negative) content must be reported, even if
      // the other field is blank.
      if (s.provided && !s.valid) {
        errors.push('Enter a whole, non-negative number for how many ' + veg.label.toLowerCase() + ' you have in stock.');
        continue;
      }
      if (e.provided && !e.valid) {
        errors.push('Enter a whole, non-negative number for how many ' + veg.label.toLowerCase() + ' you ate.');
        continue;
      }

      // At least one valid field: a blank partner is treated as zero.
      const stockQty = s.provided ? s.value : 0;
      const eatenQty = e.provided ? e.value : 0;

      if (eatenQty > stockQty) {
        errors.push(
          'You cannot eat ' + eatenQty + ' ' + veg.label.toLowerCase() +
          ' — you only have ' + stockQty + ' in stock.'
        );
        continue;
      }

      stock[veg.id] = stockQty;
      eaten[veg.id] = eatenQty;
    }

    if (errors.length > 0) {
      showError(errors.join(' '));
      setTotal('-');
      return;
    }

    let total = 0;
    for (const veg of VEGETABLES) {
      const remaining = (stock[veg.id] || 0) - (eaten[veg.id] || 0);
      setResult(veg.id, remaining);
      total += remaining;
    }
    setTotal(total);
  }

  function reset() {
    for (const veg of VEGETABLES) {
      inputFor(veg.id, 'stock').value = '';
      inputFor(veg.id, 'eaten').value = '';
      setResult(veg.id, 0);
    }
    setTotal(0);
    clearError();
  }

  document
    .querySelector('[data-testid="calculate"]')
    .addEventListener('click', calculate);
  document
    .querySelector('[data-testid="reset"]')
    .addEventListener('click', reset);

  // Initial state.
  reset();
})();
