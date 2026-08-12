const DATA_URL = "data/recipes.json";
const PAGE_SIZE = 30;

const state = {
  recipes: [],
  visible: [],
  filter: "all",
  method: "all",
  sort: "az",
  query: "",
  limit: PAGE_SIZE,
  meta: null,
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
    gin: "金酒", vodka: "伏特加", rum: "朗姆", whiskey: "威士忌",
    tequila: "龙舌兰", brandy: "白兰地", wine: "葡萄酒", beer: "啤酒",
    liqueur: "利口酒", "non-alcoholic": "无酒精", other: "其他",
  },
  methods: {
    shake: "摇和", stir: "搅拌", build: "直调", blend: "搅打",
    layer: "分层", muddle: "捣压", other: "其他",
  },
  glasses: {
    "Cocktail glass": "鸡尾酒杯", "Highball glass": "高球杯", "Collins Glass": "柯林杯",
    "Old-fashioned glass": "古典杯", "Shot glass": "烈酒杯", "Champagne flute": "香槟笛形杯",
    "Whiskey sour glass": "酸酒杯", "Margarita/Coupette glass": "玛格丽特杯",
    "Coffee mug": "咖啡杯", "Beer mug": "啤酒杯", "Wine Glass": "葡萄酒杯",
  },
};

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));

function normalizeSearch(value) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function formatDate(value) {
  if (!value) return "未知";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function ingredientSummary(recipe) {
  const names = recipe.ingredients.slice(0, 4).map((item) => item.name);
  return `${names.join(" · ")}${recipe.ingredients.length > 4 ? " · …" : ""}`;
}

function renderCard(recipe, index) {
  const iba = recipe.iba ? `<span class="iba-mark">IBA · ${escapeHtml(recipe.iba)}</span>` : `<span>${escapeHtml(recipe.category)}</span>`;
  return `
    <article class="recipe-card">
      <button class="recipe-open" type="button" data-id="${recipe.id}" aria-label="查看 ${escapeHtml(recipe.name)} 配方">
        <span class="recipe-topline"><span>${String(index + 1).padStart(3, "0")} · ${escapeHtml(labels.bases[recipe.base] || recipe.base)}</span>${iba}</span>
        <h3>${escapeHtml(recipe.name)}${recipe.alcoholic === "Non alcoholic" ? " <i>0%</i>" : ""}</h3>
        <span class="recipe-meta"><p>${escapeHtml(ingredientSummary(recipe))}</p><span class="recipe-arrow" aria-hidden="true">↗</span></span>
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
    results.sort((a, b) => Number(Boolean(b.iba)) - Number(Boolean(a.iba)) || a.name.localeCompare(b.name));
  } else if (state.sort === "newest") {
    results.sort((a, b) => String(b.modified).localeCompare(String(a.modified)) || a.name.localeCompare(b.name));
  } else {
    results.sort((a, b) => a.name.localeCompare(b.name));
  }
  state.visible = results;
}

function render() {
  filterRecipes();
  const shown = state.visible.slice(0, state.limit);
  els.grid.innerHTML = shown.map(renderCard).join("");
  els.empty.hidden = state.visible.length !== 0;
  els.status.textContent = `找到 ${state.visible.length} 款配方${shown.length < state.visible.length ? ` · 已展开 ${shown.length} 款` : ""}`;

  const remaining = state.visible.length - shown.length;
  els.loadMore.hidden = remaining <= 0;
  els.loadMore.querySelector("span").textContent = Math.min(PAGE_SIZE, remaining);
}

function recipeSourceUrl(recipe) {
  const slug = recipe.name.toLocaleLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `https://www.thecocktaildb.com/drink/${recipe.id}-${slug}-cocktail`;
}

function copyText(recipe) {
  const ingredients = recipe.ingredients.map((item) => `- ${item.measure || "适量"} ${item.name}`.trim()).join("\n");
  const instruction = recipe.instructions.zh || recipe.instructions.en;
  return `${recipe.name}\n${labels.methods[recipe.method]} · ${labels.glasses[recipe.glass] || recipe.glass}\n\n材料\n${ingredients}\n\n方法\n${instruction}\n\n来源：TheCocktailDB · ${recipeSourceUrl(recipe)}`;
}

function openRecipe(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;
  const instruction = recipe.instructions.zh || recipe.instructions.en;
  const translated = Boolean(recipe.instructions.zh);
  const tags = [
    labels.bases[recipe.base] || recipe.base,
    labels.methods[recipe.method] || recipe.method,
    labels.glasses[recipe.glass] || recipe.glass,
    recipe.alcoholic === "Non alcoholic" ? "无酒精" : "含酒精",
  ];
  if (recipe.iba) tags.unshift(`IBA · ${recipe.iba}`);

  els.dialogContent.innerHTML = `
    <article class="dialog-inner">
      <p class="dialog-kicker">${escapeHtml(recipe.category)} · ${escapeHtml(recipe.id)}</p>
      <h2 class="dialog-title" id="dialog-title">${escapeHtml(recipe.name)}</h2>
      <div class="dialog-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="dialog-grid">
        <section aria-labelledby="ingredients-${recipe.id}">
          <h3 id="ingredients-${recipe.id}">材料 / Ingredients</h3>
          <ul class="ingredient-list">
            ${recipe.ingredients.map((item) => `<li><span>${escapeHtml(item.name)}</span><span>${escapeHtml(item.measure || "适量")}</span></li>`).join("")}
          </ul>
        </section>
        <section aria-labelledby="method-${recipe.id}">
          <h3 id="method-${recipe.id}">方法 / ${escapeHtml(labels.methods[recipe.method])}</h3>
          <p class="instruction">${escapeHtml(instruction)}</p>
          ${translated ? "" : '<p class="translation-note">此条暂无中文步骤，保留来源英文。</p>'}
        </section>
      </div>
      <div class="dialog-actions">
        <button class="copy-recipe" type="button" data-copy-id="${recipe.id}">复制配方</button>
        <a href="${recipeSourceUrl(recipe)}" target="_blank" rel="noopener noreferrer">查看原始记录 ↗</a>
        ${recipe.iba ? '<a href="https://iba-world.com/cocktails/" target="_blank" rel="noopener noreferrer">IBA 清单 ↗</a>' : ""}
      </div>
    </article>`;

  els.dialog.showModal();
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
    navigator.clipboard.writeText(copyText(recipe)).then(() => showToast("配方已复制"));
  });
  const themeButton = document.querySelector(".theme-toggle");
  themeButton.addEventListener("click", () => {
    const isDark = document.documentElement.dataset.theme === "dark";
    document.documentElement.dataset.theme = isDark ? "light" : "dark";
    themeButton.setAttribute("aria-pressed", String(!isDark));
    themeButton.querySelector(".theme-label").textContent = isDark ? "纸色" : "夜色";
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
        recipe.name, recipe.category, recipe.glass, recipe.iba || "",
        recipe.instructions.zh || "", recipe.instructions.en || "",
        ...recipe.ingredients.map((item) => item.name),
      ].join(" ")),
    }));
    document.querySelector('[data-stat="recipes"]').textContent = payload.meta.recipeCount.toLocaleString("zh-CN");
    document.querySelector('[data-stat="ingredients"]').textContent = payload.meta.ingredientCount.toLocaleString("zh-CN");
    document.querySelector('[data-stat="iba"]').textContent = payload.meta.ibaCount.toLocaleString("zh-CN");
    document.querySelector("#sync-date").textContent = formatDate(payload.meta.updatedAt);
    document.querySelector("#sync-date").dateTime = payload.meta.updatedAt;
    els.loading.hidden = true;
    render();
  } catch (error) {
    console.error("Unable to load recipe archive", error);
    els.loading.hidden = true;
    els.status.textContent = "配方数据暂时无法读取，请稍后刷新。";
    els.empty.hidden = false;
  }
}

const savedTheme = localStorage.getItem("cocktail-atlas-theme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  const dark = savedTheme === "dark";
  document.querySelector(".theme-toggle").setAttribute("aria-pressed", String(dark));
  document.querySelector(".theme-label").textContent = dark ? "夜色" : "纸色";
}

bindEvents();
loadData();
