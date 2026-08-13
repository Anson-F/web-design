import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const atlasRoot = resolve(__dirname, "..");
const recipesPath = resolve(atlasRoot, "data/recipes.json");
const outputPath = resolve(atlasRoot, "data/visual-manifest.json");
const posterRoot = resolve(atlasRoot, "assets/posters");
const letters = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
const apiRoot = "https://www.thecocktaildb.com/api/json/v1/1/search.php?f=";
const sourceRoot = "https://www.thecocktaildb.com";
const promptVersion = "minimal-zine-cocktail-v1";

const recipesPayload = JSON.parse(await readFile(recipesPath, "utf8"));
const previousPayload = JSON.parse(await readFile(outputPath, "utf8").catch(() => '{"visuals":[]}'));
const previousById = new Map((previousPayload.visuals || []).map((item) => [item.id, item]));

function sourceRecordUrl(recipe) {
  const slug = recipe.name.toLocaleLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${sourceRoot}/drink/${recipe.id}-${slug}-cocktail`;
}

function joinIngredients(recipe) {
  return recipe.ingredients
    .map((item) => `${item.measure ? `${item.measure} ` : ""}${item.name}`.trim())
    .join(", ");
}

function ingredientText(recipe) {
  return recipe.ingredients.map((item) => item.name.toLowerCase()).join(" | ");
}

function liquidIngredientText(recipe) {
  const nonLiquidGarnishes = /^(maraschino cherry|cocktail cherry|cherry|olive|lemon peel|orange peel|lime peel|lemon twist|orange twist|lime twist|mint|celery|cinnamon stick)$/i;
  return recipe.ingredients
    .filter((item) => !nonLiquidGarnishes.test(item.name.trim()))
    .map((item) => item.name.toLowerCase())
    .join(" | ");
}

function inferLiquid(recipe) {
  const text = liquidIngredientText(recipe);
  const matches = [
    [/blue cura(c|ç)ao|blueberry schnapps/, "clear saturated cobalt-blue"],
    [/tomato juice|clamato/, "opaque savory tomato-red"],
    [/midori|green creme de menthe|kiwi|melon liqueur/, "luminous leaf-green"],
    [/cream|milk|coconut milk|ice-cream|yoghurt|egg white/, "pale creamy and softly opaque, tinted only as much as the other ingredients justify"],
    [/grenadine|campari|cranberry|raspberry|cherry|sloe gin|strawberry/, "ruby-red to coral"],
    [/blackberry|blackcurrant|creme de cassis|red wine/, "deep burgundy-purple"],
    [/coffee|espresso|kahlua|tia maria|chocolate|cocoa/, "dark coffee-brown"],
    [/cola|root beer|dr pepper/, "dark translucent cola-brown"],
    [/orange juice|pineapple juice|mango|peach|apricot/, "sunlit golden-orange"],
    [/grapefruit|pink lemonade/, "pale coral-pink"],
    [/lemon juice|lime juice|lemonade|soda water|tonic water/, "clear to pale citrus-gold"],
    [/champagne|prosecco|white wine|cider/, "pale sparkling straw-gold"],
    [/whisk|bourbon|scotch|brandy|cognac|dark rum|amber rum|sweet vermouth/, "transparent warm amber"],
    [/\b(beer|ale|lager)\b/, "sparkling beer-gold with a natural foam head"],
    [/\b(stout|guinness)\b/, "near-black stout-brown with a cream head"],
  ];
  return matches.find(([pattern]) => pattern.test(text))?.[1] || "clear, lightly tinted by the listed ingredients";
}

function inferIce(recipe) {
  const text = `${recipe.instructions.en} ${ingredientText(recipe)}`.toLowerCase();
  if (/crushed ice|cracked ice|pebbled ice/.test(text)) return "visible crushed or pebble ice";
  if (/blend.*ice|ice.*blend|frozen/.test(text)) return "a fine frozen texture without loose cubes";
  if (/strain|strained/.test(text) && !/strain.*(over|onto|into).*ice/.test(text)) return "no serving ice; preparation ice must not appear in the finished glass";
  if (recipe.method === "shake" && /shot glass/i.test(recipe.glass) && !/(onto|into).*ice/.test(text)) return "no serving ice; shaking ice must not appear in the finished shot";
  if (/over ice|on the rocks|ice cube|filled? .*ice|add ice/.test(text)) return "honest, clearly visible serving ice";
  if (/hot|coffee mug|warm/.test(`${recipe.glass} ${text}`.toLowerCase())) return "no ice";
  return "only the serving ice justified by the method; otherwise no visible ice";
}

function describeGlass(glass) {
  const descriptions = {
    "Cocktail glass": "V-shaped stemmed cocktail or martini glass",
    "Martini Glass": "V-shaped stemmed martini glass",
    "Highball glass": "tall straight-sided highball glass",
    "Highball Glass": "tall straight-sided highball glass",
    "Collins glass": "tall narrow Collins glass",
    "Collins Glass": "tall narrow Collins glass",
    "Old-fashioned glass": "low heavy-bottomed old-fashioned rocks glass",
    "Shot glass": "small straight-sided shot glass",
    "Champagne flute": "slender stemmed champagne flute",
    "Champagne saucer": "shallow stemmed champagne coupe",
    "Margarita/Coupette glass": "broad stemmed margarita coupette glass",
    "Hurricane glass": "curved stemmed hurricane glass",
    "Whiskey sour glass": "small stemmed whiskey-sour glass",
    "Wine Glass": "stemmed wine glass",
    "Beer Glass": "tall beer glass",
    "Beer mug": "handled beer mug",
    "Coffee mug": "handled coffee mug",
    "Coffee Mug": "handled coffee mug",
    "Pint glass": "straight-sided pint glass",
    "Cordial glass": "small stemmed cordial glass",
    "Nick and Nora Glass": "small stemmed Nick and Nora glass",
  };
  return descriptions[glass] || glass;
}

function inferFoam(recipe) {
  const text = ingredientText(recipe);
  if (/egg white|cream|milk|ice-cream/.test(text)) return "the recipe's natural creamy or aerated top texture";
  if (/\b(beer|ale|lager|stout|guinness)\b/.test(text)) return "a realistic restrained beer head";
  if (/champagne|prosecco|soda water|ginger ale|tonic water/.test(text)) return "fine natural carbonation, not exaggerated foam";
  return "no invented foam cap";
}

function inferGarnish(recipe) {
  const source = `${recipe.instructions.en} | ${ingredientText(recipe)}`.toLowerCase();
  const candidates = [
    [/(lemon peel|lemon twist|lemon rind)/, "a lemon peel or twist"],
    [/(orange peel|orange twist|orange rind)/, "an orange peel or twist"],
    [/(lime peel|lime twist|lime rind)/, "a lime peel or twist"],
    [/(pineapple)/, "a restrained pineapple garnish only when used for serving"],
    [/(mint)/, "fresh mint leaves or a mint sprig"],
    [/(maraschino cherry|cocktail cherry|\bcherry\b)/, "one cocktail cherry"],
    [/(\bolive\b)/, "one green cocktail olive"],
    [/(celery)/, "one crisp celery stalk"],
    [/(cucumber)/, "a restrained cucumber slice or ribbon"],
    [/(nutmeg)/, "a light fresh nutmeg dusting"],
    [/(cinnamon)/, "a restrained cinnamon garnish"],
    [/(salt rim|salted rim)/, "a clean salt rim"],
    [/(sugar rim|sugared rim)/, "a clean sugar rim"],
  ];
  const garnish = candidates.find(([pattern]) => pattern.test(source))?.[1];
  if (garnish) return garnish;
  if (/garnish|decorate/.test(source)) return "one historically conventional garnish for this named drink, kept restrained";
  return "no garnish unless visually indispensable to this named drink";
}

const layoutFamilies = [
  "a low-left specimen with a long vertical counter-rule",
  "an upper-right specimen with a quiet diagonal caption axis",
  "a lower-center specimen interrupted by one narrow paper strip",
  "a mid-left specimen facing a large empty right field",
  "an upper-left specimen with a tiny registration cluster near the foot",
  "a right-edge specimen with most of the drink cropped inward, balanced by open paper",
];
const imageAnchors = ["lower-left", "upper-right", "lower-center", "middle-left", "upper-left", "middle-right"];
const typographyModes = [
  "monospaced typewriter numerals",
  "condensed grotesque numerals",
  "rubber-stamp numerals",
  "small archival catalog numerals",
];
const textureModes = [
  "very restrained photocopy grain and one torn edge",
  "soft risograph halftone with slight ink misregistration",
  "faint scanner dust, a rough crop mark, and one taped corner",
  "dry newsprint grain with a single overprinted registration cross",
];
const moods = [
  "archival bartender field note",
  "1970s independent art-school zine",
  "quiet experimental print workshop proof",
  "precise museum beverage specimen card",
  "handmade late-night recipe notebook insert",
];
const accentColours = ["vermilion red", "cobalt blue", "acid yellow", "hot magenta", "signal orange", "electric cyan", "leaf green"];

function variationFor(recipe, index) {
  const seed = Number(recipe.id) || index;
  return {
    layoutFamily: layoutFamilies[(seed + index) % layoutFamilies.length],
    imageAnchor: imageAnchors[(seed * 3 + index) % imageAnchors.length],
    typography: typographyModes[(seed + index * 2) % typographyModes.length],
    texture: textureModes[(seed * 5 + index) % textureModes.length],
    mood: moods[(seed * 7 + index) % moods.length],
    accent: accentColours[(seed * 11 + index) % accentColours.length],
  };
}

function makePrompt(recipe, evidence, variation) {
  const indexMark = String(recipe.id).slice(-5);
  const layers = recipe.method === "layer"
    ? "Keep the naturally correct recipe layers distinctly visible in their physically plausible order."
    : "Do not add decorative layers that the recipe does not produce.";

  return [
    `Create a brand-new editorial cocktail poster in strict Minimal Zine Poster v0.1 style. Portrait 3:5 aged warm-white paper canvas with 76–88% quiet negative space, no border, and no full-bleed photography. Use ${variation.layoutFamily}; keep the isolated drink specimen at ${variation.imageAnchor}, occupying only 12–22% of the whole sheet.`,
    `The factual anchor must unmistakably depict “${recipe.name}” in one ${describeGlass(recipe.glass)}. Recipe evidence: ${joinIngredients(recipe)}. Finished-service evidence: ${recipe.instructions.en.replace(/\s+/g, " ").trim()} Show ${evidence.liquid}; ${evidence.ice}; ${evidence.foam}; garnish rule: ${evidence.garnish}. ${layers} Preserve every named serving action that changes the finished appearance, believable glass proportions, transparency, refraction, liquid level, and gravity. No bottle, bartender, duplicate drink, or ingredient not supported by the recipe.`,
    `Use sparse ${variation.typography} limited to safe abstract marks and numerals only: “N°”, “${indexMark}”, one short ratio-like numeric fragment, one thin rule, and one tiny registration cross. Do not print the cocktail name; the web page supplies exact bilingual naming. Add exactly one high-chroma ${variation.accent} accent, covering 0.8–2.2% of the canvas. Apply ${variation.texture}, one or two small matte tape fragments, restrained halftone, and a flat scanned-paper finish.`,
    `Mood: ${variation.mood}, austere, precise, handmade, and compositionally surprising. Avoid commercial beverage advertising, glossy luxury-bar staging, full-bleed product photography, modern app-card framing, gradients, neon, 3D or metallic type, clutter, repeated motifs, logos, watermarks, long or illegible text, excess props, invented garnish, wrong glassware, and multiple drinks.`,
  ].join("\n\n");
}

async function fetchLetter(letter) {
  const response = await fetch(`${apiRoot}${letter}`, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${letter.toUpperCase()}: HTTP ${response.status}`);
  return (await response.json()).drinks || [];
}

const raw = [];
for (let index = 0; index < letters.length; index += 6) {
  const batch = letters.slice(index, index + 6);
  raw.push(...(await Promise.all(batch.map(fetchLetter))).flat());
  process.stdout.write(`Evidence ${batch.join(",")} · ${raw.length} source records\n`);
}

const rawById = new Map(raw.map((drink) => [drink.idDrink, drink]));
const missing = recipesPayload.recipes.filter((recipe) => !rawById.has(recipe.id));
if (missing.length) {
  throw new Error(`Missing ${missing.length} source records: ${missing.slice(0, 10).map((item) => item.id).join(", ")}`);
}

await mkdir(posterRoot, { recursive: true });
const visuals = [];
for (let index = 0; index < recipesPayload.recipes.length; index += 1) {
  const recipe = recipesPayload.recipes[index];
  const rawDrink = rawById.get(recipe.id);
  const previous = previousById.get(recipe.id);
  const evidence = {
    glass: recipe.glass,
    liquid: inferLiquid(recipe),
    ice: inferIce(recipe),
    foam: inferFoam(recipe),
    garnish: inferGarnish(recipe),
    sourceImageUrl: rawDrink.strDrinkThumb || null,
    sourceImageCreator: rawDrink.strImageAttribution || null,
    sourceImagePage: rawDrink.strImageSource || null,
    creativeCommonsConfirmed: rawDrink.strCreativeCommonsConfirmed === "Yes",
  };
  const variation = variationFor(recipe, index);
  const assetPath = `assets/posters/${recipe.id}.jpg`;
  const assetExists = await access(resolve(atlasRoot, assetPath)).then(() => true).catch(() => false);
  const prompt = makePrompt(recipe, evidence, variation);
  const promptUnchanged = previous?.prompt === prompt;
  const previousStatus = previous?.generation?.status;
  const keepExistingGeneration = assetExists && ["generated", "needs-regeneration"].includes(previousStatus);

  visuals.push({
    id: recipe.id,
    name: recipe.name,
    nameZh: recipe.nameZh,
    source: {
      database: "TheCocktailDB",
      recordUrl: sourceRecordUrl(recipe),
      imageUrl: evidence.sourceImageUrl,
      imageSource: evidence.sourceImagePage,
      imageAttribution: evidence.sourceImageCreator,
      creativeCommonsConfirmed: evidence.creativeCommonsConfirmed,
      ibaVerificationUrl: recipe.iba ? "https://iba-world.com/cocktails/" : null,
      usage: "Visual evidence only; the source image is not redistributed by this project.",
    },
    evidence: {
      glass: evidence.glass,
      ingredients: recipe.ingredients,
      method: recipe.method,
      liquid: evidence.liquid,
      ice: evidence.ice,
      foam: evidence.foam,
      garnish: evidence.garnish,
    },
    design: variation,
    assetPath,
    alt: {
      zh: `${recipe.nameZh || recipe.name}调酒的极简杂志海报`,
      en: `Minimal zine poster for ${recipe.name}`,
    },
    promptVersion,
    prompt,
    generation: {
      provider: "OpenAI image generation",
      status: keepExistingGeneration ? previousStatus : "pending",
      generatedAt: keepExistingGeneration ? previous?.generation?.generatedAt || null : null,
      qa: keepExistingGeneration ? previous?.generation?.qa || "pending" : "pending",
      qaNotes: keepExistingGeneration ? previous?.generation?.qaNotes || null : null,
      promptOverride: keepExistingGeneration && !promptUnchanged
        ? previous?.generation?.promptOverride || previous?.prompt || null
        : previous?.generation?.promptOverride || null,
      bytes: keepExistingGeneration ? previous?.generation?.bytes || null : null,
    },
  });
}

const generatedCount = visuals.filter((item) => item.generation.status === "generated").length;
const payload = {
  meta: {
    title: "Cocktail Atlas visual evidence and generation manifest",
    generatedAt: new Date().toISOString(),
    promptVersion,
    recipeCount: visuals.length,
    generatedCount,
    sourcePolicy: "TheCocktailDB images are linked as visual evidence, not copied into the published site. IBA-labelled recipes carry an additional official-list verification link.",
    styleSkill: "gc-minimal-zine-poster-v0-1",
  },
  visuals,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload)}\n`, "utf8");
process.stdout.write(`Wrote ${visuals.length} visual records (${generatedCount} generated) to ${outputPath}\n`);
