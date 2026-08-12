import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const recipesPath = resolve(__dirname, "../data/recipes.json");
const namesPath = resolve(__dirname, "../data/name-zh.json");

const canonical = {
  "Americano": "美国佬",
  "Aviation": "飞行",
  "B-52": "B-52轰炸机",
  "Bellini": "贝里尼",
  "Bramble": "荆棘",
  "Caipirinha": "卡皮里尼亚",
  "Cosmopolitan": "大都会",
  "Cuba Libra": "自由古巴",
  "Cuba Libre": "自由古巴",
  "Daiquiri": "戴吉利",
  "Dark and Stormy": "黑暗风暴",
  "Death in the Afternoon": "午后之死",
  "Dirty Martini": "脏马天尼",
  "Dry Martini": "干马天尼",
  "Espresso Martini": "浓缩咖啡马天尼",
  "French 75": "法兰西75",
  "French Martini": "法式马天尼",
  "Gimlet": "吉姆雷特",
  "Gin and Soda": "金酒苏打",
  "Gin Fizz": "金菲士",
  "Gin Tonic": "金汤力",
  "Grasshopper": "绿蚱蜢",
  "Hemingway Special": "海明威特调",
  "Horse's Neck": "马颈",
  "Hot Toddy": "热托迪",
  "Irish Coffee": "爱尔兰咖啡",
  "John Collins": "约翰柯林斯",
  "Kamikaze": "神风",
  "Kir": "基尔",
  "Kir Royale": "皇家基尔",
  "Long Island Iced Tea": "长岛冰茶",
  "Long Island Tea": "长岛冰茶",
  "Mai Tai": "迈泰",
  "Manhattan": "曼哈顿",
  "Margarita": "玛格丽特",
  "Martini": "马天尼",
  "Mimosa": "含羞草",
  "Mint Julep": "薄荷朱莉普",
  "Mojito": "莫吉托",
  "Mojito Extra": "特浓莫吉托",
  "Moscow Mule": "莫斯科骡子",
  "Negroni": "内格罗尼",
  "New York Sour": "纽约酸",
  "Old Cuban": "老古巴",
  "Old Fashioned": "古典",
  "Old Pal": "老朋友",
  "Paloma": "帕洛玛",
  "Penicillin": "青霉素",
  "Pina Colada": "椰林飘香",
  "Pisco Sour": "皮斯科酸",
  "Planter's Punch": "种植园宾治",
  "Planter’s Punch": "种植园宾治",
  "Pornstar Martini": "色情明星马天尼",
  "Ramos Gin Fizz": "拉莫斯金菲士",
  "Russian Spring Punch": "俄罗斯春日宾治",
  "Rusty Nail": "锈钉",
  "Salty Dog": "咸狗",
  "Sazerac": "萨泽拉克",
  "Screwdriver": "螺丝刀",
  "Sea breeze": "海风",
  "Sidecar": "边车",
  "Tequila Sunrise": "龙舌兰日出",
  "The Last Word": "最后一语",
  "Tom Collins": "汤姆柯林斯",
  "Vesper": "维斯帕",
  "Vodka And Tonic": "伏特加汤力",
  "Vodka Martini": "伏特加马天尼",
  "Vodka Tonic": "伏特加汤力",
  "Whiskey Sour": "威士忌酸",
  "White Lady": "白色佳人",
  "White Russian": "白俄罗斯",
  "Yellow Bird": "黄鸟",
  "Zombie": "僵尸",
};

const keepOriginal = /^(?:[\d\W]+|[A-Z](?:[A-Z\d&. -]*[A-Z\d.])?)$/;

async function translateBatch(names) {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "en",
    tl: "zh-CN",
    dt: "t",
    q: names.join("\n"),
  });
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Google Translate HTTP ${response.status}`);
  const payload = await response.json();
  const text = payload[0].map((segment) => segment[0]).join("").replace(/\n$/, "");
  const translated = text.split("\n");
  if (translated.length !== names.length) {
    throw new Error(`Expected ${names.length} translations, received ${translated.length}`);
  }
  return translated;
}

const payload = JSON.parse(await readFile(recipesPath, "utf8"));
const names = payload.recipes.map((recipe) => recipe.name);
const mapping = {};

for (let index = 0; index < names.length; index += 24) {
  const batch = names.slice(index, index + 24);
  const translated = await translateBatch(batch);
  batch.forEach((name, offset) => {
    const generated = translated[offset].trim();
    mapping[name] = canonical[name] || (keepOriginal.test(name) ? name : generated || name);
  });
  process.stdout.write(`Translated ${Math.min(index + batch.length, names.length)} / ${names.length}\n`);
}

const ordered = Object.fromEntries(names.map((name) => [name, mapping[name]]));
await writeFile(namesPath, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");

payload.recipes = payload.recipes.map((recipe) => ({ ...recipe, nameZh: ordered[recipe.name] || recipe.name }));
await writeFile(recipesPath, `${JSON.stringify(payload)}\n`, "utf8");
process.stdout.write(`Wrote ${names.length} Chinese names to ${namesPath} and recipes.json\n`);
