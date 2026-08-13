#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "cocktail-terms.js"), "utf8"), context);
const terms = context.window.CocktailTerms;

const expectedIngredients = new Map([
  ["Frangelico", "Frangelico 榛果利口酒"],
  ["Half-and-half", "Half-and-half 稀奶油"],
  ["Crown Royal", "Crown Royal 加拿大威士忌"],
  ["Elderflower cordial", "接骨木花糖浆"],
]);
for (const [source, expected] of expectedIngredients) {
  if (terms.ingredient(source) !== expected) {
    throw new Error(`${source}: expected ${expected}, got ${terms.ingredient(source)}`);
  }
}

const expectedMeasures = new Map([
  ["2 shots", "2 shot"],
  ["Fill with", "加满"],
  ["Top", "补满"],
  ["Garnish with", "装饰用"],
  ["1 cup crushed", "1 杯 碎"],
  ["2 drops", "2 滴"],
  ["1 whole", "1 整颗"],
]);
for (const [source, expected] of expectedMeasures) {
  if (terms.measure(source) !== expected) {
    throw new Error(`${source}: expected ${expected}, got ${terms.measure(source)}`);
  }
}

console.log("PASS: ingredient names and quantity-field prose use contemporary Chinese bar terminology");
