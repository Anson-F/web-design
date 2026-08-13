import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const atlasRoot = resolve(__dirname, "..");
const manifestPath = resolve(atlasRoot, "data/visual-manifest.json");
const recipesPath = resolve(atlasRoot, "data/recipes.json");
const outputRoot = resolve(atlasRoot, "prompts/qa-redo");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const recipes = JSON.parse(await readFile(recipesPath, "utf8")).recipes;
const recipeById = new Map(recipes.map((item) => [item.id, item]));

const serviceOverrides = {
  "12914": "exactly one serving vessel: one clear glass pitcher containing the cooked eggnog; do not add a cup, mug, glass, ladle, or side serving",
  "17246": "exactly one small stemmed chilled coupe, as required by the detailed final-service instruction; ignore the conflicting Beer Glass metadata",
  "178357": "exactly one stemmed cocktail glass; this project recipe contains no side sparkling-wine shot, so do not add any sidecar",
};
const appearanceOverrides = {
  "17246": "dark translucent coffee-brown with the coffee liqueur visibly sunk near the bottom; no cinnamon, no solid garnish, only five tiny habanero-tincture drops",
};

function ratioMarks(recipe) {
  const values = recipe.ingredients.slice(0, 4).map((item) => item.measure.match(/[\d½¼¾⅓⅔]+/)?.[0]).filter(Boolean);
  return values.length >= 2 ? values.join(":") : "1:1";
}

function promptFor(record, recipe) {
  const ingredients = recipe.ingredients.map((item) => `${item.measure || "to taste"} ${item.name}`).join(", ");
  const service = serviceOverrides[record.id] || `exactly one ${record.evidence.glass}`;
  const fullInstruction = recipe.instructions.en.replace(/\s+/g, " ").trim();
  const serviceInstruction = fullInstruction.length > 900 ? fullInstruction.slice(-900) : fullInstruction;
  const appearance = appearanceOverrides[record.id]
    ? `${appearanceOverrides[record.id]}; ice rule: ${record.evidence.ice}; foam rule: ${record.evidence.foam}`
    : `${record.evidence.liquid}; ice rule: ${record.evidence.ice}; foam rule: ${record.evidence.foam}; garnish rule: ${record.evidence.garnish}`;
  return [
    `Create one brand-new portrait 3:5 cocktail poster in strict Minimal Zine Poster v0.1 style. Use a flat aged warm-white scanned-paper canvas with 82–88% quiet negative space, no border, and no full-bleed photograph. Place one small isolated drink specimen in the lower-left or lower-right quadrant, occupying 12–18% of the sheet.`,
    `Depict “${record.name}” as ${service}. Recipe evidence: ${ingredients}. Final service instruction: ${serviceInstruction} The finished appearance should be ${appearance}. Preserve recipe-required layers only. Show believable glass proportions, liquid level, gravity, transparency or opacity, and refraction.`,
    `Hard object-count constraint: show exactly ONE drink vessel in the entire poster, unless the service override above explicitly specifies a pitcher as that single vessel. No second glass, no tiny side glass, no sidecar, no partial glass entering from an edge, no enlarged crop of the same drink, no pitcher plus cup, no duplicate reflection, no bottle, no shaker, and no background vessel. The single specimen must be fully visible with comfortable paper around all edges.`,
    `Use sparse safe typography limited to “N°”, “${record.id}”, “${ratioMarks(recipe)}”, one thin rule, and one registration cross. Do not print the cocktail name or ingredient words. Use exactly one tiny ${record.design.accent} accent, 0.8–1.8% of the canvas. Apply ${record.design.texture}, one small matte tape fragment, restrained halftone, slight ink misregistration, and a flat paper-scan finish.`,
    `Mood: ${record.design.mood}, austere, precise, handmade, and quiet. Avoid commercial advertising, bar scenery, full-bleed product photography, gradients outside the drink, neon, 3D type, clutter, logos, watermarks, long text, invented garnish, wrong glassware, and more than the one explicitly allowed vessel.`,
  ].join("\n\n");
}

await mkdir(outputRoot, { recursive: true });
let count = 0;
for (const record of manifest.visuals.filter((item) => item.generation.qa === "fail")) {
  const recipe = recipeById.get(record.id);
  if (!recipe) throw new Error(`Missing recipe ${record.id}`);
  await writeFile(resolve(outputRoot, `${record.id}.txt`), `${promptFor(record, recipe)}\n`, "utf8");
  count += 1;
}
process.stdout.write(`Wrote ${count} strict QA redo prompts to ${outputRoot}\n`);
