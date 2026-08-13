const BUILD_VERSION = "20260813-title-outside-1";
const DATA_URL = `data/recipes.json?v=${BUILD_VERSION}`;
const PAGE_SIZE = 30;
const L = window.CocktailLocale;
const T = window.CocktailTerms;
const pick = (zh, en) => L.pick(zh, en);

const state = {
  recipes: [],
  visible: [],
  filter: "all",
  method: "all",
  sort: "az",
  query: "",
  limit: PAGE_SIZE,
  meta: null,
  activeRecipeId: null,
};

const els = {
  grid: document.querySelector("#recipe-grid"),
  loading: document.querySelector(".loading-grid"),
  status: document.querySelector("#results-status"),
  empty: document.querySelector("#empty-state"),
  search: document.querySelector("#recipe-search"),
  clear: document.querySelector(".clear-search"),
  method: document.querySelector("#method-filter"),
  sort: document.querySelector("#sort-order"),
  loadMore: document.querySelector("#load-more"),
  dialog: document.querySelector("#recipe-dialog"),
  dialogContent: document.querySelector("#dialog-content"),
  toast: document.querySelector(".toast"),
};

const labels = {
  bases: {
    gin: ["金酒", "Gin"], vodka: ["伏特加", "Vodka"], rum: ["朗姆", "Rum"], whiskey: ["威士忌", "Whiskey"],
    tequila: ["龙舌兰", "Tequila"], brandy: ["白兰地", "Brandy"], wine: ["葡萄酒", "Wine"], beer: ["啤酒", "Beer"],
    liqueur: ["利口酒", "Liqueur"], "non-alcoholic": ["无酒精", "Non-alcoholic"], other: ["其他", "Other"],
  },
  methods: {
    shake: ["摇和", "Shake"], stir: ["搅拌", "Stir"], build: ["直调", "Build"], blend: ["搅打", "Blend"],
    layer: ["分层", "Layer"], muddle: ["捣压", "Muddle"], other: ["其他", "Other"],
  },
  glasses: {
    "Balloon Glass": "气球杯", "Beer Glass": "啤酒杯", "Beer mug": "啤酒马克杯", "Beer pilsner": "皮尔森啤酒杯",
    "Brandy snifter": "白兰地杯", "Champagne Flute": "笛形香槟杯", "Champagne flute": "笛形香槟杯",
    "Cocktail Glass": "鸡尾酒杯", "Cocktail glass": "鸡尾酒杯", "Coffee Mug": "咖啡马克杯", "Coffee mug": "咖啡马克杯",
    "Collins Glass": "柯林杯", "Collins glass": "柯林杯", "Copper Mug": "铜马克杯", "Cordial glass": "利口酒杯",
    "Coupe Glass": "碟形香槟杯", "Highball Glass": "高球杯", "Highball glass": "高球杯", "Hurricane glass": "飓风杯",
    "Irish coffee cup": "爱尔兰咖啡杯", "Jar": "玻璃罐", "Margarita glass": "玛格丽特杯",
    "Margarita/Coupette glass": "玛格丽特杯", "Martini Glass": "马天尼杯", "Mason jar": "梅森罐",
    "Nick and Nora Glass": "尼克诺拉杯", "Old-Fashioned glass": "古典杯", "Old-fashioned glass": "古典杯",
    "Pint glass": "品脱杯", "Pitcher": "扎壶", "Pousse cafe glass": "彩虹杯", "Punch Bowl": "潘趣碗",
    "Punch bowl": "潘趣碗", "Shot glass": "shot 杯", "Shot Glass": "shot 杯", "Whiskey Glass": "威士忌杯",
    "Whiskey sour glass": "酸酒杯", "White wine glass": "白葡萄酒杯", "Wine Glass": "葡萄酒杯",
  },
  categories: {
    "Cocktail": "鸡尾酒", "Ordinary Drink": "混合饮品", "Shot": "shot", "Coffee / Tea": "咖啡 / 茶",
    "Punch / Party Drink": "潘趣 / 派对饮品", "Homemade Liqueur": "自制利口酒", "Soft Drink": "软饮",
    "Cocoa": "可可", "Beer": "啤酒", "Shake": "奶昔", "Other / Unknown": "其他",
  },
};

function localLabel(group, key) {
  const value = labels[group][key];
  if (Array.isArray(value)) return L.isChinese ? L.zh(value[0]) : value[1];
  if (group === "glasses") return L.isChinese ? L.zh(value || key) : key;
  if (group === "categories") return L.isChinese ? L.zh(value || key) : key;
  return key;
}

function nameHtml(recipe) {
  if (L.current === "en") return `<span class="localized-name" lang="en">${escapeHtml(recipe.name)}</span>`;
  return `<span class="localized-name" lang="${L.languageTag}">${escapeHtml(L.zh(recipe.nameZh || recipe.name))}</span><small class="original-name" lang="en">${escapeHtml(recipe.name)}</small>`;
}

function displayName(recipe) {
  return L.isChinese ? L.zh(recipe.nameZh || recipe.name) : recipe.name;
}

function posterAlt(recipe) {
  return pick(`${recipe.nameZh || recipe.name} / ${recipe.name} 调酒海报`, `Minimal zine poster for ${recipe.name}`);
}

function posterImage(recipe, className = "cocktail-poster-image") {
  return `<img class="${className}" src="assets/posters/${recipe.id}.jpg" alt="${escapeHtml(posterAlt(recipe))}" width="720" height="1200" loading="lazy" decoding="async">`;
}

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));

function normalizeSearch(value) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function formatDate(value) {
  if (!value) return pick("未知", "Unknown");
  return new Intl.DateTimeFormat(L.isChinese ? L.languageTag : "en-US", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value));
}

function recipeFormulaHtml(recipe) {
  const ingredients = recipe.ingredients.map((item) => {
    const name = L.isChinese ? L.zh(T.ingredient(item.name)) : item.name;
    const measure = L.isChinese ? L.zh(T.measure(item.measure || "适量")) : (item.measure || "To taste");
    return `<span class="recipe-formula-row"><span>${escapeHtml(name)}</span><small>${escapeHtml(measure)}</small></span>`;
  }).join("");
  return `
    <span class="recipe-formula">
      <span class="recipe-formula-label">${pick("配方 / FORMULA", "Formula")}</span>
      <span class="recipe-formula-list">${ingredients}</span>
      ${recipe.ingredients.length > 4 ? `<span class="recipe-formula-more">＋ ${recipe.ingredients.length - 4} ${pick("项材料", "more")}</span>` : ""}
    </span>`;
}

function titleLengthClass(recipe) {
  const length = Array.from(displayName(recipe)).length;
  if (length > 16) return "is-title-long";
  if (length > 9) return "is-title-medium";
  return "";
}

function renderCard(recipe, index) {
  const iba = recipe.iba ? `<span class="iba-mark">IBA · ${escapeHtml(recipe.iba)}</span>` : `<span>${escapeHtml(localLabel("categories", recipe.category))}</span>`;
  return `
    <article class="recipe-card">
      <button class="recipe-open" type="button" data-id="${recipe.id}" aria-label="${escapeHtml(pick(`查看 ${displayName(recipe)} 配方`, `View ${recipe.name} recipe`))}">
        <span class="recipe-poster">
          ${posterImage(recipe)}
        </span>
        <span class="recipe-card-copy">
          <span class="recipe-topline"><span>${String(index + 1).padStart(3, "0")} · ${escapeHtml(localLabel("bases", recipe.base))}</span>${iba}</span>
          <h3 class="recipe-poster-title ${titleLengthClass(recipe)}">${nameHtml(recipe)}${recipe.alcoholic === "Non alcoholic" ? " <i>0%</i>" : ""}</h3>
          ${recipeFormulaHtml(recipe)}
          <span class="recipe-meta"><p>${escapeHtml(localLabel("methods", recipe.method))} · ${escapeHtml(localLabel("glasses", recipe.glass))}</p><span class="recipe-arrow" aria-hidden="true">↗</span></span>
        </span>
      </button>
    </article>`;
}

function filterRecipes() {
  const query = normalizeSearch(state.query);
  const words = query.split(/\s+/).filter(Boolean);

  let results = state.recipes.filter((recipe) => {
    if (state.filter === "iba" && !recipe.iba) return false;
    if (state.filter === "non-alcoholic" && recipe.alcoholic !== "Non alcoholic") return false;
    if (!["all", "iba", "non-alcoholic"].includes(state.filter) && recipe.base !== state.filter) return false;
    if (state.method !== "all" && recipe.method !== state.method) return false;
    return words.every((word) => recipe.search.includes(word));
  });

  if (state.sort === "iba") {
    results.sort((a, b) => Number(Boolean(b.iba)) - Number(Boolean(a.iba)) || displayName(a).localeCompare(displayName(b), L.languageTag));
  } else if (state.sort === "newest") {
    results.sort((a, b) => String(b.modified).localeCompare(String(a.modified)) || displayName(a).localeCompare(displayName(b), L.languageTag));
  } else {
    results.sort((a, b) => displayName(a).localeCompare(displayName(b), L.languageTag));
  }
  state.visible = results;
}

function render() {
  filterRecipes();
  const shown = state.visible.slice(0, state.limit);
  els.grid.innerHTML = shown.map(renderCard).join("");
  els.empty.hidden = state.visible.length !== 0;
  els.status.textContent = L.isChinese
    ? L.zh(`找到 ${state.visible.length} 款配方${shown.length < state.visible.length ? ` · 已展开 ${shown.length} 款` : ""}`)
    : `${state.visible.length} recipes found${shown.length < state.visible.length ? ` · showing ${shown.length}` : ""}`;

  const remaining = state.visible.length - shown.length;
  els.loadMore.hidden = remaining <= 0;
  els.loadMore.querySelector("b").textContent = `${Math.min(PAGE_SIZE, remaining)} ${pick("款", "")}`.trim();
}

function recipeSourceUrl(recipe) {
  const slug = recipe.name.toLocaleLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `https://www.thecocktaildb.com/drink/${recipe.id}-${slug}-cocktail`;
}

function copyText(recipe) {
  const ingredients = recipe.ingredients.map((item) => {
    const name = L.isChinese ? L.zh(T.ingredient(item.name)) : item.name;
    const measure = L.isChinese ? L.zh(T.measure(item.measure || "适量")) : (item.measure || "To taste");
    return `- ${measure} ${name}`.trim();
  }).join("\n");
  const instruction = L.isChinese ? L.zh(recipe.instructions.zh || recipe.instructions.en) : recipe.instructions.en;
  const heading = L.isChinese ? `${displayName(recipe)} / ${recipe.name}` : recipe.name;
  return `${heading}\n${localLabel("methods", recipe.method)} · ${localLabel("glasses", recipe.glass)}\n\n${pick("材料", "Ingredients")}\n${ingredients}\n\n${pick("方法", "Method")}\n${instruction}\n\n${pick("来源", "Source")}：TheCocktailDB · ${recipeSourceUrl(recipe)}`;
}

function openRecipe(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;
  state.activeRecipeId = id;
  const instruction = L.isChinese ? L.zh(recipe.instructions.zh || recipe.instructions.en) : recipe.instructions.en;
  const translated = L.current === "en" || Boolean(recipe.instructions.zh);
  const tags = [
    localLabel("bases", recipe.base),
    localLabel("methods", recipe.method),
    localLabel("glasses", recipe.glass),
    recipe.alcoholic === "Non alcoholic" ? pick("无酒精", "Non-alcoholic") : pick("含酒精", "Alcoholic"),
  ];
  if (recipe.iba) tags.unshift(`IBA · ${recipe.iba}`);

  els.dialogContent.innerHTML = `
    <article class="dialog-inner">
      <div class="dialog-hero">
        <div class="dialog-poster">${posterImage(recipe)}</div>
        <div>
          <p class="dialog-kicker">${escapeHtml(localLabel("categories", recipe.category))} · ${escapeHtml(recipe.id)}</p>
          <h2 class="dialog-title" id="dialog-title">${nameHtml(recipe)}</h2>
          <div class="dialog-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
      </div>
      <div class="dialog-grid">
        <section aria-labelledby="ingredients-${recipe.id}">
          <h3 id="ingredients-${recipe.id}">${pick("材料 / Ingredients", "Ingredients")}</h3>
          <ul class="ingredient-list">
            ${recipe.ingredients.map((item) => {
              const name = L.isChinese ? L.zh(T.ingredient(item.name)) : item.name;
              const measure = L.isChinese ? L.zh(T.measure(item.measure || "适量")) : (item.measure || "To taste");
              return `<li><span>${escapeHtml(name)}</span><span>${escapeHtml(measure)}</span></li>`;
            }).join("")}
          </ul>
        </section>
        <section aria-labelledby="method-${recipe.id}">
          <h3 id="method-${recipe.id}">${pick("方法", "Method")} / ${escapeHtml(localLabel("methods", recipe.method))}</h3>
          <p class="instruction">${escapeHtml(instruction)}</p>
          ${translated ? "" : `<p class="translation-note">${pick("此条暂无中文步骤，保留来源英文。", "")}</p>`}
        </section>
      </div>
      <div class="dialog-actions">
        <a href="order.html?add=${recipe.id}" class="add-to-order">${pick("加入点单 →", "Add to order →")}</a>
        <button class="copy-recipe" type="button" data-copy-id="${recipe.id}">${pick("复制配方", "Copy recipe")}</button>
        <a href="${recipeSourceUrl(recipe)}" target="_blank" rel="noopener noreferrer">${pick("查看原始记录 ↗", "View source record ↗")}</a>
        ${recipe.iba ? `<a href="https://iba-world.com/cocktails/" target="_blank" rel="noopener noreferrer">${pick("IBA 清单 ↗", "IBA list ↗")}</a>` : ""}
      </div>
    </article>`;

  if (!els.dialog.open) els.dialog.showModal();
  document.querySelector(".dialog-close").focus();
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

function resetFilters() {
  state.filter = "all";
  state.method = "all";
  state.sort = "az";
  state.query = "";
  state.limit = PAGE_SIZE;
  els.search.value = "";
  els.clear.hidden = true;
  els.method.value = "all";
  els.sort.value = "az";
  document.querySelectorAll(".filter-chip").forEach((button) => {
    const active = button.dataset.filter === "all";
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  render();
}

function bindEvents() {
  let searchTimer;
  els.search.addEventListener("input", () => {
    els.clear.hidden = !els.search.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = els.search.value;
      state.limit = PAGE_SIZE;
      render();
    }, 120);
  });
  els.clear.addEventListener("click", () => {
    els.search.value = "";
    state.query = "";
    els.clear.hidden = true;
    els.search.focus();
    render();
  });
  document.querySelector(".filter-row").addEventListener("click", (event) => {
    const button = event.target.closest(".filter-chip");
    if (!button) return;
    state.filter = button.dataset.filter;
    state.limit = PAGE_SIZE;
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      const active = chip === button;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    render();
  });
  els.method.addEventListener("change", () => { state.method = els.method.value; state.limit = PAGE_SIZE; render(); });
  els.sort.addEventListener("change", () => { state.sort = els.sort.value; state.limit = PAGE_SIZE; render(); });
  els.loadMore.addEventListener("click", () => { state.limit += PAGE_SIZE; render(); });
  document.querySelector("#reset-filters").addEventListener("click", resetFilters);
  els.grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (button) openRecipe(button.dataset.id);
  });
  document.querySelector(".dialog-close").addEventListener("click", () => els.dialog.close());
  els.dialog.addEventListener("click", (event) => {
    if (event.target === els.dialog) els.dialog.close();
    const button = event.target.closest("[data-copy-id]");
    if (!button) return;
    const recipe = state.recipes.find((item) => item.id === button.dataset.copyId);
    navigator.clipboard.writeText(copyText(recipe)).then(() => showToast(pick("配方已复制", "Recipe copied")));
  });
  const themeButton = document.querySelector(".theme-toggle");
  themeButton.addEventListener("click", () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = isDark ? "light" : "dark";
    themeButton.setAttribute("aria-pressed", String(!isDark));
    themeButton.querySelector(".theme-label").textContent = isDark ? L.t("common.themeLight") : L.t("common.themeDark");
    localStorage.setItem("cocktail-atlas-theme", isDark ? "light" : "dark");
  });
}

async function loadData() {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    state.meta = payload.meta;
    state.recipes = payload.recipes.map((recipe) => ({
      ...recipe,
      search: normalizeSearch([
        recipe.name, recipe.nameZh || "", L.toTaiwan(recipe.nameZh || ""), recipe.category, recipe.glass, recipe.iba || "",
        recipe.instructions.zh || "", recipe.instructions.en || "",
        ...recipe.ingredients.flatMap((item) => [item.name, T.ingredient(item.name), L.toTaiwan(T.ingredient(item.name))]),
      ].join(" ")),
    }));
    const numberLocale = L.isChinese ? L.languageTag : "en-US";
    document.querySelector('[data-stat="recipes"]').textContent = payload.meta.recipeCount.toLocaleString(numberLocale);
    document.querySelector('[data-stat="ingredients"]').textContent = payload.meta.ingredientCount.toLocaleString(numberLocale);
    document.querySelector('[data-stat="iba"]').textContent = payload.meta.ibaCount.toLocaleString(numberLocale);
    document.querySelector("#sync-date").textContent = formatDate(payload.meta.updatedAt);
    document.querySelector("#sync-date").dateTime = payload.meta.updatedAt;
    els.loading.hidden = true;
    render();
  } catch (error) {
    console.error("Unable to load recipe archive", error);
    els.loading.hidden = true;
    els.status.textContent = pick("配方数据暂时无法读取，请稍后刷新。", "Recipe data is temporarily unavailable. Please refresh later.");
    els.empty.hidden = false;
  }
}

const savedTheme = localStorage.getItem("cocktail-atlas-theme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  const dark = savedTheme === "dark";
  document.querySelector(".theme-toggle").setAttribute("aria-pressed", String(dark));
  document.querySelector(".theme-label").textContent = dark ? L.t("common.themeDark") : L.t("common.themeLight");
}
document.querySelector(".theme-label").textContent = document.documentElement.dataset.theme === "dark"
  ? L.t("common.themeDark")
  : L.t("common.themeLight");

bindEvents();
loadData();

document.addEventListener("error", (event) => {
  if (!event.target.matches?.(".cocktail-poster-image")) return;
  event.target.closest(".recipe-poster, .dialog-poster")?.classList.add("is-missing");
  event.target.hidden = true;
}, true);

window.addEventListener("cocktail-locale-change", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.querySelector(".theme-label").textContent = dark ? L.t("common.themeDark") : L.t("common.themeLight");
  if (state.meta) {
    document.querySelector("#sync-date").textContent = formatDate(state.meta.updatedAt);
    render();
    if (els.dialog.open && state.activeRecipeId) openRecipe(state.activeRecipeId);
  }
});
