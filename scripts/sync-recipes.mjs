import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(__dirname, "../data/recipes.json");
const namesPath = resolve(__dirname, "../data/name-zh.json");
const instructionsPath = resolve(__dirname, "../data/instruction-zh.json");
const letters = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
const apiRoot = "https://www.thecocktaildb.com/api/json/v1/1/search.php?f=";
const chineseNames = JSON.parse(await readFile(namesPath, "utf8").catch(() => "{}"));
const chineseInstructions = JSON.parse(await readFile(instructionsPath, "utf8").catch(() => "{}"));

function deriveMethod(instructions = "") {
  const text = instructions.toLowerCase();
  if (/mudd|mash|crush/.test(text)) return "muddle";
  if (/blend|blender/.test(text)) return "blend";
  if (/layer|float .*top|back of .*spoon/.test(text)) return "layer";
  if (/shake|shaker/.test(text)) return "shake";
  if (/stir|mixing glass/.test(text)) return "stir";
  if (/build|pour|top (up|with)|fill .*glass/.test(text)) return "build";
  return "other";
}

function deriveBase(drink, ingredients) {
  if (drink.strAlcoholic === "Non alcoholic") return "non-alcoholic";
  const haystack = ingredients.map((item) => item.name.toLowerCase()).join(" | ");
  const bases = [
    ["gin", /\bgin\b/],
    ["vodka", /\bvodka\b/],
    ["rum", /\brum\b|cachaca|cachaça/],
    ["whiskey", /whisk|bourbon|scotch|rye whiskey/],
    ["tequila", /tequila|mezcal/],
    ["brandy", /brandy|cognac|pisco|calvados/],
    ["wine", /\bwine\b|champagne|prosecco|vermouth|sherry|port\b/],
    ["beer", /\bbeer\b|ale\b|stout\b|lager\b/],
    ["liqueur", /liqueur|amaretto|schnapps|kahlua|baileys|curacao|curaçao/],
  ];
  return bases.find(([, pattern]) => pattern.test(haystack))?.[0] || "other";
}

function normalise(drink) {
  const ingredients = [];
  for (let index = 1; index <= 15; index += 1) {
    const name = drink[`strIngredient${index}`]?.trim();
    if (!name) continue;
    ingredients.push({ name, measure: drink[`strMeasure${index}`]?.trim() || "" });
  }
  const english = drink.strInstructions?.trim() || "";
  return {
    id: drink.idDrink,
    name: drink.strDrink?.trim() || "Untitled",
    nameZh: chineseNames[drink.strDrink?.trim()] || drink.strDrink?.trim() || "未命名",
    category: drink.strCategory?.trim() || "Other",
    iba: drink.strIBA?.trim() || null,
    alcoholic: drink.strAlcoholic?.trim() || "Unknown",
    glass: drink.strGlass?.trim() || "Glass",
    method: deriveMethod(english),
    base: deriveBase(drink, ingredients),
    instructions: {
      zh: chineseInstructions[drink.idDrink] || drink["strInstructionsZH-HANS"]?.trim() || "",
      en: english,
    },
    ingredients,
    tags: (drink.strTags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    modified: drink.dateModified || null,
  };
}

async function fetchLetter(letter) {
  const response = await fetch(`${apiRoot}${letter}`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${letter.toUpperCase()}: HTTP ${response.status}`);
  const payload = await response.json();
  return payload.drinks || [];
}

const raw = [];
for (let index = 0; index < letters.length; index += 5) {
  const batch = letters.slice(index, index + 5);
  const drinks = await Promise.all(batch.map(fetchLetter));
  raw.push(...drinks.flat());
  process.stdout.write(`Synced ${batch.join(",")} · ${raw.length} records\n`);
}

const byId = new Map(raw.map((drink) => [drink.idDrink, normalise(drink)]));
const recipes = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
const ingredients = new Set(recipes.flatMap((recipe) => recipe.ingredients.map((item) => item.name.toLowerCase())));
const payload = {
  meta: {
    title: "Cocktail Atlas snapshot",
    source: "TheCocktailDB",
    sourceUrl: "https://www.thecocktaildb.com/",
    updatedAt: new Date().toISOString(),
    recipeCount: recipes.length,
    ingredientCount: ingredients.size,
    ibaCount: recipes.filter((recipe) => recipe.iba).length,
    nonAlcoholicCount: recipes.filter((recipe) => recipe.alcoholic === "Non alcoholic").length,
  },
  recipes,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, "utf8");
process.stdout.write(`Wrote ${recipes.length} recipes and ${ingredients.size} ingredients to ${outputPath}\n`);
