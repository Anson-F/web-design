const DATA_URL = "data/recipes.json";
const ORDER_KEY = "cocktail-atlas-order-v1";
const ORDER_NOTE_KEY = "cocktail-atlas-order-note-v1";
const PAGE_SIZE = 32;

const state = {
  recipes: [],
  visible: [],
  cart: new Map(),
  query: "",
  filter: "all",
  limit: PAGE_SIZE,
};

const els = {
  search: document.querySelector("#order-search"),
  clearSearch: document.querySelector(".order-clear-search"),
  resultsStatus: document.querySelector("#order-results-status"),
  loading: document.querySelector(".order-loading"),
  menu: document.querySelector("#order-menu-list"),
  emptyResults: document.querySelector("#order-empty-results"),
  loadMore: document.querySelector("#order-load-more"),
  selected: document.querySelector("#selected-drinks"),
  emptyTicket: document.querySelector("#empty-ticket"),
  form: document.querySelector("#order-form"),
  error: document.querySelector("#order-error"),
  note: document.querySelector("#order-note"),
  noteCount: document.querySelector("#order-note-count"),
  confirm: document.querySelector(".confirm-order"),
  clearOrder: document.querySelector(".clear-order"),
  dialog: document.querySelector("#confirmation-dialog"),
  dialogContent: document.querySelector("#confirmation-content"),
  toast: document.querySelector(".toast"),
};

const baseLabels = {
  gin: "金酒", vodka: "伏特加", rum: "朗姆", whiskey: "威士忌",
  tequila: "龙舌兰", brandy: "白兰地", wine: "葡萄酒", beer: "啤酒",
  liqueur: "利口酒", "non-alcoholic": "无酒精", other: "其他",
};

const methodLabels = {
  shake: "摇和", stir: "搅拌", build: "直调", blend: "搅打",
  layer: "分层", muddle: "捣压", other: "其他",
};

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));

function normalizeSearch(value) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function ingredientSummary(recipe) {
  const names = recipe.ingredients.slice(0, 5).map((item) => item.name);
  return `${names.join(" · ")}${recipe.ingredients.length > 5 ? " · …" : ""}`;
}

function loadSavedOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDER_KEY) || "{}");
    Object.entries(saved).forEach(([id, quantity]) => {
      const safeQuantity = Math.min(20, Math.max(1, Number(quantity) || 1));
      state.cart.set(id, safeQuantity);
    });
  } catch (error) {
    console.warn("Saved order could not be restored", error);
  }
  els.note.value = localStorage.getItem(ORDER_NOTE_KEY) || "";
  updateNoteCount();
}

function saveOrder() {
  localStorage.setItem(ORDER_KEY, JSON.stringify(Object.fromEntries(state.cart)));
}

function totalGlasses() {
  return [...state.cart.values()].reduce((sum, quantity) => sum + quantity, 0);
}

function filterRecipes() {
  const words = normalizeSearch(state.query).split(/\s+/).filter(Boolean);
  state.visible = state.recipes.filter((recipe) => {
    if (state.filter === "iba" && !recipe.iba) return false;
    if (state.filter === "non-alcoholic" && recipe.alcoholic !== "Non alcoholic") return false;
    if (!["all", "iba", "non-alcoholic"].includes(state.filter) && recipe.base !== state.filter) return false;
    return words.every((word) => recipe.search.includes(word));
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function menuItem(recipe) {
  const quantity = state.cart.get(recipe.id) || 0;
  const flag = recipe.iba ? `IBA · ${recipe.iba}` : recipe.category;
  return `
    <article class="order-menu-item">
      <div class="order-menu-item-inner">
        <div class="order-menu-copy">
          <span>${escapeHtml(baseLabels[recipe.base] || recipe.base)} · ${escapeHtml(methodLabels[recipe.method] || recipe.method)} · ${escapeHtml(flag)}</span>
          <h3>${escapeHtml(recipe.name)}${recipe.alcoholic === "Non alcoholic" ? " <i>0%</i>" : ""}</h3>
          <p>${escapeHtml(ingredientSummary(recipe))}</p>
        </div>
        <button class="add-drink${quantity ? " has-quantity" : ""}" type="button" data-add-id="${recipe.id}" aria-label="加入一杯 ${escapeHtml(recipe.name)}">
          ${quantity ? `再加一杯<span>已选 ${quantity}</span>` : "加入"}
        </button>
      </div>
    </article>`;
}

function renderMenu() {
  filterRecipes();
  const shown = state.visible.slice(0, state.limit);
  els.menu.innerHTML = shown.map(menuItem).join("");
  els.resultsStatus.textContent = `酒单共 ${state.visible.length} 款${shown.length < state.visible.length ? ` · 已展开 ${shown.length} 款` : ""}`;
  els.emptyResults.hidden = state.visible.length !== 0;
  const remaining = state.visible.length - shown.length;
  els.loadMore.hidden = remaining <= 0;
  els.loadMore.querySelector("span").textContent = Math.min(PAGE_SIZE, remaining);
}

function selectedItem(recipe, quantity) {
  return `
    <article class="selected-drink">
      <div>
        <h3>${escapeHtml(recipe.name)}</h3>
        <p>${escapeHtml(baseLabels[recipe.base] || recipe.base)} · ${escapeHtml(methodLabels[recipe.method] || recipe.method)}</p>
      </div>
      <div class="quantity-controls" aria-label="${escapeHtml(recipe.name)} 数量">
        <button type="button" data-decrease-id="${recipe.id}" aria-label="减少一杯 ${escapeHtml(recipe.name)}">−</button>
        <output aria-label="当前 ${quantity} 杯">${quantity}</output>
        <button type="button" data-increase-id="${recipe.id}" aria-label="增加一杯 ${escapeHtml(recipe.name)}">＋</button>
      </div>
      <button class="remove-drink" type="button" data-remove-id="${recipe.id}">从点单纸移除</button>
    </article>`;
}

function renderTicket() {
  const selectedRecipes = [...state.cart.entries()]
    .map(([id, quantity]) => ({ recipe: state.recipes.find((item) => item.id === id), quantity }))
    .filter((item) => item.recipe);
  els.selected.innerHTML = selectedRecipes.map(({ recipe, quantity }) => selectedItem(recipe, quantity)).join("");

  const total = totalGlasses();
  document.querySelectorAll("[data-order-total]").forEach((node) => { node.textContent = total; });
  els.emptyTicket.hidden = total > 0;
  els.confirm.disabled = total === 0;
  els.clearOrder.disabled = total === 0;
  if (total > 0) els.error.hidden = true;
  saveOrder();
  renderMenu();
}

function addDrink(id) {
  state.cart.set(id, Math.min(20, (state.cart.get(id) || 0) + 1));
  renderTicket();
  const recipe = state.recipes.find((item) => item.id === id);
  showToast(`${recipe?.name || "这杯"} 已加入点单`);
}

function changeQuantity(id, delta) {
  const next = (state.cart.get(id) || 0) + delta;
  if (next <= 0) state.cart.delete(id);
  else state.cart.set(id, Math.min(20, next));
  renderTicket();
}

function clearOrder() {
  state.cart.clear();
  els.note.value = "";
  localStorage.removeItem(ORDER_NOTE_KEY);
  updateNoteCount();
  renderTicket();
}

function updateNoteCount() {
  const remaining = 160 - els.note.value.length;
  els.noteCount.textContent = `还可输入 ${remaining} 字`;
}

function orderCode() {
  const now = new Date();
  const date = [String(now.getFullYear()).slice(-2), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
  return `JP-${date}-${now.getTime().toString(36).slice(-4).toUpperCase()}`;
}

function orderText(code) {
  const lines = [...state.cart.entries()].map(([id, quantity]) => {
    const recipe = state.recipes.find((item) => item.id === id);
    return `${quantity} 杯 · ${recipe?.name || id}`;
  });
  return `酒谱点单 ${code}\n${lines.join("\n")}\n共 ${totalGlasses()} 杯${els.note.value.trim() ? `\n备注：${els.note.value.trim()}` : ""}`;
}

function openConfirmation() {
  if (state.cart.size === 0) {
    els.error.hidden = false;
    els.error.focus();
    return;
  }
  const code = orderCode();
  const rows = [...state.cart.entries()].map(([id, quantity]) => {
    const recipe = state.recipes.find((item) => item.id === id);
    return `<li><span>${escapeHtml(recipe?.name || id)}</span><b>× ${quantity}</b></li>`;
  }).join("");
  const note = els.note.value.trim();

  els.dialogContent.innerHTML = `
    <article class="confirmation-sheet">
      <p class="confirmation-kicker">Order Confirmed · ${totalGlasses()} Glasses</p>
      <h2 id="confirmation-title">这单，<br>记好了。</h2>
      <p class="confirmation-code">${code}</p>
      <ul class="confirmation-list">${rows}</ul>
      ${note ? `<p class="confirmation-note"><small>备注</small>${escapeHtml(note)}</p>` : ""}
      <div class="confirmation-actions">
        <button class="copy-order" type="button" data-copy-code="${code}">复制点单纸</button>
        <button type="button" data-return-order>返回修改</button>
        <button type="button" data-finish-order>完成并清空</button>
      </div>
    </article>`;
  els.dialog.showModal();
  document.querySelector(".confirmation-close").focus();
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("is-visible"), 2100);
}

function resetFilters() {
  state.query = "";
  state.filter = "all";
  state.limit = PAGE_SIZE;
  els.search.value = "";
  els.clearSearch.hidden = true;
  document.querySelectorAll(".order-filters .filter-chip").forEach((button) => {
    const active = button.dataset.filter === "all";
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderMenu();
}

function bindEvents() {
  let searchTimer;
  els.search.addEventListener("input", () => {
    els.clearSearch.hidden = !els.search.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = els.search.value;
      state.limit = PAGE_SIZE;
      renderMenu();
    }, 120);
  });
  els.clearSearch.addEventListener("click", () => {
    els.search.value = "";
    state.query = "";
    els.clearSearch.hidden = true;
    els.search.focus();
    renderMenu();
  });
  document.querySelector(".order-filters").addEventListener("click", (event) => {
    const button = event.target.closest(".filter-chip");
    if (!button) return;
    state.filter = button.dataset.filter;
    state.limit = PAGE_SIZE;
    document.querySelectorAll(".order-filters .filter-chip").forEach((chip) => {
      const active = chip === button;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    renderMenu();
  });
  els.menu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-add-id]");
    if (button) addDrink(button.dataset.addId);
  });
  els.selected.addEventListener("click", (event) => {
    const increase = event.target.closest("[data-increase-id]");
    const decrease = event.target.closest("[data-decrease-id]");
    const remove = event.target.closest("[data-remove-id]");
    if (increase) changeQuantity(increase.dataset.increaseId, 1);
    if (decrease) changeQuantity(decrease.dataset.decreaseId, -1);
    if (remove) { state.cart.delete(remove.dataset.removeId); renderTicket(); }
  });
  els.loadMore.addEventListener("click", () => { state.limit += PAGE_SIZE; renderMenu(); });
  document.querySelector("#reset-order-search").addEventListener("click", resetFilters);
  els.note.addEventListener("input", () => {
    updateNoteCount();
    localStorage.setItem(ORDER_NOTE_KEY, els.note.value);
  });
  els.form.addEventListener("submit", (event) => { event.preventDefault(); openConfirmation(); });
  els.clearOrder.addEventListener("click", clearOrder);
  document.querySelector(".mobile-order-bar").addEventListener("click", () => document.querySelector("#order").scrollIntoView({ behavior: "smooth" }));
  document.querySelector(".confirmation-close").addEventListener("click", () => els.dialog.close());
  els.dialog.addEventListener("click", (event) => {
    if (event.target === els.dialog || event.target.closest("[data-return-order]")) els.dialog.close();
    const copy = event.target.closest("[data-copy-code]");
    if (copy) navigator.clipboard.writeText(orderText(copy.dataset.copyCode)).then(() => showToast("点单纸已复制"));
    if (event.target.closest("[data-finish-order]")) {
      els.dialog.close();
      clearOrder();
      showToast("点单纸已清空");
    }
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
    state.recipes = payload.recipes.map((recipe) => ({
      ...recipe,
      search: normalizeSearch([recipe.name, recipe.category, recipe.iba || "", ...recipe.ingredients.map((item) => item.name)].join(" ")),
    }));
    els.loading.hidden = true;
    loadSavedOrder();

    const addId = new URLSearchParams(location.search).get("add");
    if (addId && state.recipes.some((recipe) => recipe.id === addId)) {
      state.cart.set(addId, Math.min(20, (state.cart.get(addId) || 0) + 1));
      history.replaceState({}, "", "order.html");
      showToast("已从配方页加入点单");
    }
    renderTicket();
  } catch (error) {
    console.error("Unable to load order menu", error);
    els.loading.hidden = true;
    els.resultsStatus.textContent = "酒单暂时无法读取，请稍后刷新。";
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
