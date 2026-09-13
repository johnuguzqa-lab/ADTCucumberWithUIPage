// Custom Cucumber parameter types.
//
// These let Gherkin read naturally while step definitions receive clean,
// typed values:
//
//   {veg}  -> canonical vegetable id ("cucumbers", "carrots", ...)
//             accepts both singular and plural wording in feature files
//   {qty}  -> a non-negative integer; the word "none" is accepted as 0
//
// Built-in {int} is used for plain integer assertions.

'use strict';

const { defineParameterType } = require('@cucumber/cucumber');

const VEG_IDS = {
  cucumber: 'cucumbers',
  cucumbers: 'cucumbers',
  carrot: 'carrots',
  carrots: 'carrots',
  tomato: 'tomatoes',
  tomatoes: 'tomatoes',
  pepper: 'peppers',
  peppers: 'peppers'
};

defineParameterType({
  name: 'veg',
  regexp: /cucumbers|carrots|tomatoes|peppers|cucumber|carrot|tomato|pepper/,
  transformer(value) {
    return VEG_IDS[value];
  }
});

defineParameterType({
  name: 'qty',
  regexp: /\d+|none/,
  transformer(value) {
    if (value === 'none') return 0;
    return parseInt(value, 10);
  }
});
