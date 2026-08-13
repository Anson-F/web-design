const DATA_URL = "data/recipes.json";
const QUOTES_URL = "data/order-quotes.json";
const ORDER_KEY = "cocktail-atlas-order-v1";
const ORDER_NOTE_KEY = "cocktail-atlas-order-note-v1";
const PAGE_SIZE = 32;
const L = window.CocktailLocale;
const T = window.CocktailTerms;
const pick = (zh, en) => L.pick(zh, en);

const state = {
  recipes: [],
  quotes: new Map(),
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
  carouselCount: document.querySelector("#order-carousel-count"),
  carouselPrev: document.querySelector("#order-carousel-prev"),
  carouselNext: document.querySelector("#order-carousel-next"),
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
  gin: ["金酒", "Gin"], vodka: ["伏特加", "Vodka"], rum: ["朗姆", "Rum"], whiskey: ["威士忌", "Whiskey"],
  tequila: ["龙舌兰", "Tequila"], brandy: ["白兰地", "Brandy"], wine: ["葡萄酒", "Wine"], beer: ["啤酒", "Beer"],
  liqueur: ["利口酒", "Liqueur"], "non-alcoholic": ["无酒精", "Non-alcoholic"], other: ["其他", "Other"],
};

const methodLabels = {
  shake: ["摇和", "Shake"], stir: ["搅拌", "Stir"], build: ["直调", "Build"], blend: ["搅打", "Blend"],
  layer: ["分层", "Layer"], muddle: ["捣压", "Muddle"], other: ["其他", "Other"],
};

const categoryLabels = {
  "Beer": ["啤酒", "Beer"], "Cocktail": ["鸡尾酒", "Cocktail"], "Cocoa": ["可可", "Cocoa"],
  "Coffee / Tea": ["咖啡 / 茶", "Coffee / Tea"], "Homemade Liqueur": ["自制利口酒", "Homemade Liqueur"],
  "Ordinary Drink": ["混合饮品", "Mixed Drink"], "Other / Unknown": ["其他", "Other"],
  "Punch / Party Drink": ["潘趣 / 派对饮品", "Punch / Party Drink"], "Shake": ["奶昔", "Shake"],
  "Shot": ["shot", "Shot"], "Soft Drink": ["软饮", "Soft Drink"],
};

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
}[char]));

function localLabel(dictionary, key) {
  const value = dictionary[key] || [key, key];
  return L.isChinese ? L.zh(value[0]) : value[1];
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

function posterImage(recipe) {
  return `<img class="cocktail-poster-image" src="assets/posters/${recipe.id}.jpg" alt="${escapeHtml(posterAlt(recipe))}" width="720" height="1200" loading="lazy" decoding="async">`;
}

function normalizeSearch(value) {
  return value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function ingredientSummary(recipe) {
  const names = recipe.ingredients.slice(0, 5).map((item) => L.isChinese ? L.zh(T.ingredient(item.name)) : item.name);
  return `${names.join(" · ")}${recipe.ingredients.length > 5 ? " · …" : ""}`;
}

function localizedField(field) {
  if (L.current === "zh-Hant") return field.zhHant;
  if (L.current === "zh-Hans") return field.zhHans;
  return field.en;
}

function quoteHtml(recipe) {
  const entry = state.quotes.get(recipe.id);
  if (!entry) return "";
  const { quote, basis } = entry;
  const chineseOriginal = quote.language.startsWith("zh");
  const original = chineseOriginal ? (L.current === "zh-Hant" ? quote.translation.zhHant : quote.translation.zhHans) : quote.original;
  const translation = chineseOriginal
    ? (L.current === "en" ? quote.translation.en : "")
    : (L.current === "zh-Hant" ? quote.translation.zhHant : quote.translation.zhHans);
  const translationLang = chineseOriginal ? "en" : (L.current === "zh-Hant" ? "zh-Hant" : "zh-CN");
  const author = localizedField(quote.attribution.author);
  const work = localizedField(quote.attribution.work);
  const rationale = localizedField(basis.rationale);
  return `
    <figure class="drink-poem${chineseOriginal ? " is-chinese" : " is-foreign"}" data-quote-id="${quote.id}" data-poem-id="${recipe.id}" title="${escapeHtml(rationale)}">
      <blockquote class="poem-original" lang="${chineseOriginal ? L.languageTag : quote.language}">${escapeHtml(original).replaceAll(" / ", "<br>")}</blockquote>
      ${translation ? `<p class="poem-translation" lang="${translationLang}" data-label="${L.current === "zh-Hant" ? "譯 · " : "译 · "}">${escapeHtml(translation)}</p>` : ""}
      <figcaption><span>${escapeHtml(author)} · <cite>${escapeHtml(work)}</cite></span><a href="${escapeHtml(quote.attribution.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(`${L.t("order.quoteSource")}: ${author}, ${work}`)}">${L.t("order.quoteSource")} ↗</a></figcaption>
    </figure>`;
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
  }).sort((a, b) => displayName(a).localeCompare(displayName(b), L.languageTag));
}

function menuItem(recipe) {
  const quantity = state.cart.get(recipe.id) || 0;
  const flag = recipe.iba ? `IBA · ${recipe.iba}` : localLabel(categoryLabels, recipe.category);
  return `
    <article class="order-menu-item" data-recipe-id="${recipe.id}">
      <div class="order-menu-item-inner">
        <span class="order-menu-poster">${posterImage(recipe)}</span>
        <div class="order-menu-copy">
          <span>${escapeHtml(localLabel(baseLabels, recipe.base))} · ${escapeHtml(localLabel(methodLabels, recipe.method))} · ${escapeHtml(flag)}</span>
          <h3>${nameHtml(recipe)}${recipe.alcoholic === "Non alcoholic" ? " <i>0%</i>" : ""}</h3>
          ${quoteHtml(recipe)}
          <p class="order-card-ingredients">${escapeHtml(ingredientSummary(recipe))}</p>
        </div>
        <button class="add-drink${quantity ? " has-quantity" : ""}" type="button" data-add-id="${recipe.id}" aria-label="${escapeHtml(pick(`加入一杯 ${displayName(recipe)}`, `Add one ${recipe.name}`))}">
          ${quantity ? `${pick("再加一杯", "Add another")}<span>${pick(`已选 ${quantity}`, `${quantity} selected`)}</span>` : pick("加入", "Add")}
        </button>
      </div>
    </article>`;
}

function renderMenu() {
  filterRecipes();
  const shown = state.visible.slice(0, state.limit);
  els.menu.innerHTML = shown.map(menuItem).join("");
  els.resultsStatus.textContent = L.isChinese
    ? L.zh(`酒单共 ${state.visible.length} 款${shown.length < state.visible.length ? ` · 已展开 ${shown.length} 款` : ""}`)
    : `${state.visible.length} drinks${shown.length < state.visible.length ? ` · showing ${shown.length}` : ""}`;
  els.emptyResults.hidden = state.visible.length !== 0;
  const remaining = state.visible.length - shown.length;
  els.loadMore.hidden = remaining <= 0;
  els.loadMore.querySelector("b").textContent = `${Math.min(PAGE_SIZE, remaining)} ${pick("款", "")}`.trim();
  requestAnimationFrame(() => {
    els.menu.scrollLeft = 0;
    updateCarouselControls();
  });
}

function carouselItems() {
  return [...els.menu.querySelectorAll(".order-menu-item")];
}

function currentCarouselIndex() {
  const items = carouselItems();
  if (!items.length) return 0;
  const left = els.menu.getBoundingClientRect().left;
  return items.reduce((best, item, index) => {
    const distance = Math.abs(item.getBoundingClientRect().left - left);
    return distance < best.distance ? { index, distance } : best;
  }, { index: 0, distance: Infinity }).index;
}

function updateCarouselControls() {
  const items = carouselItems();
  const index = currentCarouselIndex();
  els.carouselCount.textContent = items.length ? `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}` : "00 / 00";
  els.carouselPrev.disabled = !items.length || index === 0;
  els.carouselNext.disabled = !items.length || index === items.length - 1;
}

function moveCarousel(direction) {
  const items = carouselItems();
  if (!items.length) return;
  const target = items[Math.max(0, Math.min(items.length - 1, currentCarouselIndex() + direction))];
  target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
}

function selectedItem(recipe, quantity) {
  return `
    <article class="selected-drink">
      <span class="selected-poster">${posterImage(recipe)}</span>
      <div>
        <h3>${nameHtml(recipe)}</h3>
        <p>${escapeHtml(localLabel(baseLabels, recipe.base))} · ${escapeHtml(localLabel(methodLabels, recipe.method))}</p>
      </div>
      <div class="quantity-controls" aria-label="${escapeHtml(pick(`${displayName(recipe)} 数量`, `${recipe.name} quantity`))}">
        <button type="button" data-decrease-id="${recipe.id}" aria-label="${escapeHtml(pick(`减少一杯 ${displayName(recipe)}`, `Remove one ${recipe.name}`))}">−</button>
        <output aria-label="${escapeHtml(pick(`当前 ${quantity} 杯`, `Current quantity: ${quantity}`))}">${quantity}</output>
        <button type="button" data-increase-id="${recipe.id}" aria-label="${escapeHtml(pick(`增加一杯 ${displayName(recipe)}`, `Add one ${recipe.name}`))}">＋</button>
      </div>
      <button class="remove-drink" type="button" data-remove-id="${recipe.id}">${pick("从点单纸移除", "Remove from order")}</button>
    </article>`;
}

function renderTicket() {
  const selectedRecipes = [...state.cart.entries()]
    .map(([id, quantity]) => ({ recipe: state.recipes.find((item) => item.id === id), quantity }))
    .filter((item) => item.recipe);
  els.selected.innerHTML = selectedRecipes.map(({ recipe, quantity }) => selectedItem(recipe, quantity)).join("");

  const total = totalGlasses();
  document.querySelectorAll("[data-order-total]").forEach((node) => { node.textContent = total; });
  document.querySelectorAll("[data-order-unit]").forEach((node) => { node.textContent = L.isChinese ? "杯" : (total === 1 ? "glass" : "glasses"); });
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
  showToast(pick(`${recipe ? displayName(recipe) : "这杯"} 已加入点单`, `${recipe?.name || "Drink"} added to order`));
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
  els.noteCount.textContent = pick(`还可输入 ${remaining} 字`, `${remaining} characters remaining`);
}

function orderCode() {
  const now = new Date();
  const date = [String(now.getFullYear()).slice(-2), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
  return `JP-${date}-${now.getTime().toString(36).slice(-4).toUpperCase()}`;
}

function orderText(code) {
  const lines = [...state.cart.entries()].map(([id, quantity]) => {
    const recipe = state.recipes.find((item) => item.id === id);
    const title = recipe ? (L.isChinese ? `${displayName(recipe)} / ${recipe.name}` : recipe.name) : id;
    return pick(`${quantity} 杯 · ${title}`, `${quantity} × ${title}`);
  });
  return L.isChinese
    ? L.zh(`酒谱点单 ${code}\n${lines.join("\n")}\n共 ${totalGlasses()} 杯${els.note.value.trim() ? `\n备注：${els.note.value.trim()}` : ""}`)
    : `Cocktail Atlas order ${code}\n${lines.join("\n")}\n${totalGlasses()} glasses total${els.note.value.trim() ? `\nNote: ${els.note.value.trim()}` : ""}`;
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
    return `<li><span>${recipe ? nameHtml(recipe) : escapeHtml(id)}</span><b>× ${quantity}</b></li>`;
  }).join("");
  const note = els.note.value.trim();

  els.dialogContent.innerHTML = `
    <article class="confirmation-sheet">
      <p class="confirmation-kicker">${pick("点单已确认", "Order confirmed")} · ${totalGlasses()} ${pick("杯", "glasses")}</p>
      <h2 id="confirmation-title">${pick("这单，<br>记好了。", "Your order<br>is noted.")}</h2>
      <p class="confirmation-code">${code}</p>
      <ul class="confirmation-list">${rows}</ul>
      ${note ? `<p class="confirmation-note"><small>${pick("备注", "Note")}</small>${escapeHtml(note)}</p>` : ""}
      <div class="confirmation-actions">
        <button class="copy-order" type="button" data-copy-code="${code}">${pick("复制点单纸", "Copy order slip")}</button>
        <button type="button" data-return-order>${pick("返回修改", "Return to edit")}</button>
        <button type="button" data-finish-order>${pick("完成并清空", "Finish and clear")}</button>
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
  els.carouselPrev.addEventListener("click", () => moveCarousel(-1));
  els.carouselNext.addEventListener("click", () => moveCarousel(1));
  els.menu.addEventListener("scroll", () => requestAnimationFrame(updateCarouselControls), { passive: true });
  els.menu.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    moveCarousel(event.key === "ArrowRight" ? 1 : -1);
  });
  els.menu.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    els.menu.scrollBy({ left: event.deltaY, behavior: "auto" });
  }, { passive: false });
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
    if (copy) navigator.clipboard.writeText(orderText(copy.dataset.copyCode)).then(() => showToast(pick("点单纸已复制", "Order slip copied")));
    if (event.target.closest("[data-finish-order]")) {
      els.dialog.close();
      clearOrder();
      showToast(pick("点单纸已清空", "Order slip cleared"));
    }
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
    const [recipeResponse, quoteResponse] = await Promise.all([fetch(DATA_URL), fetch(QUOTES_URL)]);
    if (!recipeResponse.ok || !quoteResponse.ok) throw new Error(`HTTP ${recipeResponse.status}/${quoteResponse.status}`);
    const [payload, quotePayload] = await Promise.all([recipeResponse.json(), quoteResponse.json()]);
    const quoteLibrary = new Map(quotePayload.quotes.map((quote) => [quote.id, quote]));
    state.quotes = new Map(quotePayload.assignments.map((assignment) => [assignment.id, { quote: quoteLibrary.get(assignment.quoteId), basis: assignment.basis }]));
    state.recipes = payload.recipes.map((recipe) => ({
      ...recipe,
      search: normalizeSearch([recipe.name, recipe.nameZh || "", L.toTraditional(recipe.nameZh || ""), recipe.category, recipe.iba || "", ...recipe.ingredients.flatMap((item) => [item.name, T.ingredient(item.name), L.toTraditional(T.ingredient(item.name))])].join(" ")),
    }));
    els.loading.hidden = true;
    loadSavedOrder();

    const addId = new URLSearchParams(location.search).get("add");
    if (addId && state.recipes.some((recipe) => recipe.id === addId)) {
      state.cart.set(addId, Math.min(20, (state.cart.get(addId) || 0) + 1));
      history.replaceState({}, "", "order.html");
      showToast(pick("已从配方页加入点单", "Added from recipe page"));
    }
    renderTicket();
  } catch (error) {
    console.error("Unable to load order menu", error);
    els.loading.hidden = true;
    els.resultsStatus.textContent = pick("酒单暂时无法读取，请稍后刷新。", "The drinks menu is temporarily unavailable. Please refresh later.");
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
  event.target.closest(".order-menu-poster, .selected-poster")?.classList.add("is-missing");
  event.target.hidden = true;
}, true);

window.addEventListener("cocktail-locale-change", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.querySelector(".theme-label").textContent = dark ? L.t("common.themeDark") : L.t("common.themeLight");
  updateNoteCount();
  if (state.recipes.length) renderTicket();
});
