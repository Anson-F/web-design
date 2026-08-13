(() => {
  const STORAGE_KEY = "cocktail-atlas-language";
  const dictionaries = {
    zh: {
      "common.brandHome": "酒谱首页",
      "common.backHome": "返回酒谱首页",
      "common.nav": "页面导航",
      "common.recipes": "配方",
      "common.order": "点单",
      "common.sources": "来源",
      "common.language": "语言选择",
      "common.theme": "切换明暗主题",
      "common.themeDark": "夜色",
      "common.themeLight": "纸色",
      "common.all": "全部",
      "common.iba": "IBA 经典",
      "common.nonAlcoholic": "无酒精",
      "common.gin": "金酒",
      "common.vodka": "伏特加",
      "common.rum": "朗姆",
      "common.whiskey": "威士忌",
      "common.tequila": "龙舌兰",
      "common.close": "关闭",
      "common.glasses": "杯",

      "index.metaTitle": "酒谱 · Cocktail Atlas",
      "index.metaDescription": "可搜索、可筛选、标注来源的中英文鸡尾酒配方与调制方法档案。",
      "index.skip": "跳到配方目录",
      "index.heroEyebrow": "开放配方档案",
      "index.heroTitle": "把吧台，<br>折进一页索引。",
      "index.heroIntro": "从经典 Martini 到无酒精混合饮：按名字、材料、基酒与技法查找，配方、杯型和步骤一次看清。",
      "index.heroAction": "开始查配方 <span aria-hidden=\"true\">↘</span>",
      "index.statsLabel": "档案统计",
      "index.recipeCount": "当前收录",
      "index.recipeUnit": "款配方",
      "index.ingredientCount": "原料索引",
      "index.ingredientUnit": "种材料",
      "index.ibaCount": "IBA 标记",
      "index.ibaUnit": "款经典",
      "index.catalogTitle": "配方目录",
      "index.catalogIntro": "输入酒名或原料；也可以从基酒、技法与 IBA 标记开始缩小范围。",
      "index.searchLabel": "搜索酒名 / 原料",
      "index.searchPlaceholder": "例如：莫吉托、Mojito、金酒",
      "index.clearSearch": "清除搜索",
      "index.filtersLabel": "配方快速筛选",
      "index.methodLabel": "调制技法",
      "index.methodAll": "全部技法",
      "index.methodShake": "摇和 Shake",
      "index.methodStir": "搅拌 Stir",
      "index.methodBuild": "直调 Build",
      "index.methodBlend": "搅打 Blend",
      "index.methodLayer": "分层 Layer",
      "index.methodMuddle": "捣压 Muddle",
      "index.methodOther": "其他",
      "index.sortLabel": "排列",
      "index.sortAz": "名称 A–Z",
      "index.sortIba": "IBA 优先",
      "index.sortNewest": "最近更新",
      "index.loading": "正在装订配方档案…",
      "index.snapshot": "数据快照",
      "index.emptyTitle": "这杯暂时不在索引里",
      "index.emptyCopy": "换一个酒名、材料，或者清除筛选再试。",
      "index.reset": "重置全部筛选",
      "index.loadMore": "继续展开",
      "index.techniqueTitle": "先选方法，<br>再决定声音。",
      "index.shakeTitle": "摇和",
      "index.shakeCopy": "含柑橘、蛋白或糖浆时，用冰快速摇匀、降温并增加空气感。",
      "index.stirTitle": "搅拌",
      "index.stirCopy": "以烈酒为主的透明酒体，用冰温柔搅拌，保持清澈和丝滑。",
      "index.buildTitle": "直调",
      "index.buildCopy": "直接在杯中依次加入材料和冰，适合 Highball 与简单长饮。",
      "index.sourceTitle": "每一杯，<br>都留着来路。",
      "index.sourceCopy": "当前目录由 TheCocktailDB 公开 API 可读取的 A–Z / 0–9 索引生成，并保留其材料、用量、杯型、调制说明和更新时间。标有 IBA 的配方，可进一步前往国际调酒师协会官方清单核对。",
      "index.dbLink": "TheCocktailDB 开放数据库 ↗",
      "index.ibaLink": "IBA 官方鸡尾酒清单 ↗",
      "index.caution": "<b>适量饮酒。</b>配方是制作参考，不构成健康建议；未成年人请勿饮酒。众包数据可能存在地区版本差异，请以个人耐受和当地法规为准。",
      "index.backTop": "回到顶部 ↑",
      "index.closeRecipe": "关闭配方详情",

      "order.metaTitle": "点单 · 酒谱 Cocktail Atlas",
      "order.metaDescription": "酒谱中英文纯点单界面：选择鸡尾酒、数量和备注，生成可复制的点单纸。",
      "order.skip": "跳到点单酒单",
      "order.heroTitle": "今晚，<br>想喝哪一杯？",
      "order.heroIntro": "从完整酒谱中选酒、调整杯数，再留一条给调酒师的备注。只记下你真正想喝的。",
      "order.heroAction": "翻开酒单 <span aria-hidden=\"true\">↘</span>",
      "order.menuTitle": "选酒",
      "order.menuIntro": "搜索酒名或原料，也可以按基酒和经典标记浏览。每次点击“加入”增加一杯。",
      "order.searchLabel": "搜索酒名 / 原料",
      "order.searchPlaceholder": "例如：内格罗尼、Negroni、朗姆",
      "order.clearSearch": "清除搜索",
      "order.filtersLabel": "酒单筛选",
      "order.loading": "正在展开酒单…",
      "order.empty": "没有找到这杯，试试其他酒名或原料。",
      "order.clearFilters": "清除筛选",
      "order.more": "再展开",
      "order.ticketTitle": "点单纸",
      "order.error": "请先从左侧酒单加入至少一杯。",
      "order.emptyTitle": "点单纸还是空的",
      "order.emptyCopy": "从酒单加入一杯，它会出现在这里。",
      "order.noteLabel": "给调酒师的备注",
      "order.optional": "可选",
      "order.noteHelp": "例如：少甜、不加装饰、其中一杯无酒精。",
      "order.confirm": "确认点单 <span aria-hidden=\"true\">→</span>",
      "order.clear": "清空点单纸",
      "order.localNote": "点单在此页面生成；确认后可复制单据交给调酒师。",
      "order.mobileView": "查看点单",
      "order.mobileLabel": "查看点单纸",
      "order.closeConfirmation": "关闭确认单",
    },
    en: {
      "common.brandHome": "Cocktail Atlas home",
      "common.backHome": "Back to Cocktail Atlas",
      "common.nav": "Primary navigation",
      "common.recipes": "Recipes",
      "common.order": "Order",
      "common.sources": "Sources",
      "common.language": "Language selection",
      "common.theme": "Switch color theme",
      "common.themeDark": "Night",
      "common.themeLight": "Paper",
      "common.all": "All",
      "common.iba": "IBA classics",
      "common.nonAlcoholic": "Non-alcoholic",
      "common.gin": "Gin",
      "common.vodka": "Vodka",
      "common.rum": "Rum",
      "common.whiskey": "Whiskey",
      "common.tequila": "Tequila",
      "common.close": "Close",
      "common.glasses": "glasses",

      "index.metaTitle": "Cocktail Atlas · Recipes & Methods",
      "index.metaDescription": "A searchable bilingual archive of cocktail recipes, ingredients, glassware, methods, and sources.",
      "index.skip": "Skip to recipe catalog",
      "index.heroEyebrow": "Open recipe archive",
      "index.heroTitle": "The whole bar,<br>folded into an index.",
      "index.heroIntro": "From a classic Martini to a zero-proof mixed drink: search by name, ingredient, spirit, or technique, then see the measures and method in one place.",
      "index.heroAction": "Browse recipes <span aria-hidden=\"true\">↘</span>",
      "index.statsLabel": "Archive statistics",
      "index.recipeCount": "Recipes indexed",
      "index.recipeUnit": "recipes",
      "index.ingredientCount": "Ingredients",
      "index.ingredientUnit": "ingredients",
      "index.ibaCount": "IBA listed",
      "index.ibaUnit": "classics",
      "index.catalogTitle": "Recipe catalog",
      "index.catalogIntro": "Search by drink or ingredient, then narrow the list by base spirit, technique, or IBA status.",
      "index.searchLabel": "Search drinks / ingredients",
      "index.searchPlaceholder": "Try Mojito, gin, or coffee",
      "index.clearSearch": "Clear search",
      "index.filtersLabel": "Quick recipe filters",
      "index.methodLabel": "Technique",
      "index.methodAll": "All techniques",
      "index.methodShake": "Shake",
      "index.methodStir": "Stir",
      "index.methodBuild": "Build",
      "index.methodBlend": "Blend",
      "index.methodLayer": "Layer",
      "index.methodMuddle": "Muddle",
      "index.methodOther": "Other",
      "index.sortLabel": "Sort",
      "index.sortAz": "Name A–Z",
      "index.sortIba": "IBA first",
      "index.sortNewest": "Recently updated",
      "index.loading": "Binding the recipe archive…",
      "index.snapshot": "Data snapshot",
      "index.emptyTitle": "That drink is not in this index",
      "index.emptyCopy": "Try another drink or ingredient, or clear the current filters.",
      "index.reset": "Reset all filters",
      "index.loadMore": "Show another",
      "index.techniqueTitle": "Choose the method.<br>Then set the tone.",
      "index.shakeTitle": "Shake",
      "index.shakeCopy": "Use ice and a brisk shake for citrus, egg white, or syrup—chilling, diluting, and adding air.",
      "index.stirTitle": "Stir",
      "index.stirCopy": "Stir spirit-forward, transparent drinks over ice to keep them clear and silky.",
      "index.buildTitle": "Build",
      "index.buildCopy": "Add ingredients and ice directly to the serving glass, ideal for highballs and simple long drinks.",
      "index.sourceTitle": "Every drink<br>keeps its provenance.",
      "index.sourceCopy": "This catalog is generated from the A–Z / 0–9 records available through TheCocktailDB public API, retaining ingredients, measures, glassware, instructions, and update dates. IBA-tagged drinks can be checked against the International Bartenders Association list.",
      "index.dbLink": "TheCocktailDB open database ↗",
      "index.ibaLink": "IBA official cocktail list ↗",
      "index.caution": "<b>Drink responsibly.</b> Recipes are preparation references, not health advice. Alcohol is for adults of legal drinking age. Crowd-sourced recipes may vary by region; consider your tolerance and local laws.",
      "index.backTop": "Back to top ↑",
      "index.closeRecipe": "Close recipe details",

      "order.metaTitle": "Order · Cocktail Atlas",
      "order.metaDescription": "A price-free cocktail ordering interface: choose drinks and quantities, add an optional note, and copy the order slip.",
      "order.skip": "Skip to the drinks menu",
      "order.heroTitle": "What are we<br>drinking tonight?",
      "order.heroIntro": "Choose from the full archive, adjust the number of glasses, and leave one optional note for the bartender. Nothing more than what you want to drink.",
      "order.heroAction": "Open the menu <span aria-hidden=\"true\">↘</span>",
      "order.menuTitle": "Choose a drink",
      "order.menuIntro": "Search by drink or ingredient, or browse by base spirit and IBA status. Each press of Add adds one glass.",
      "order.searchLabel": "Search drinks / ingredients",
      "order.searchPlaceholder": "Try Negroni, rum, or coffee",
      "order.clearSearch": "Clear search",
      "order.filtersLabel": "Menu filters",
      "order.loading": "Opening the drinks menu…",
      "order.empty": "No drinks matched. Try another name or ingredient.",
      "order.clearFilters": "Clear filters",
      "order.more": "Show another",
      "order.ticketTitle": "Order slip",
      "order.error": "Add at least one drink from the menu first.",
      "order.emptyTitle": "Your order slip is empty",
      "order.emptyCopy": "Add a drink from the menu and it will appear here.",
      "order.noteLabel": "Note for the bartender",
      "order.optional": "Optional",
      "order.noteHelp": "For example: less sweet, no garnish, or make one alcohol-free.",
      "order.confirm": "Confirm order <span aria-hidden=\"true\">→</span>",
      "order.clear": "Clear order slip",
      "order.localNote": "This order is created on this page. After confirming, copy the slip for your bartender.",
      "order.mobileView": "View order",
      "order.mobileLabel": "View order slip",
      "order.closeConfirmation": "Close confirmation",
    },
  };

  const traditional = window.CocktailTraditional?.convert || ((value) => String(value ?? ""));
  dictionaries["zh-Hans"] = dictionaries.zh;
  dictionaries["zh-Hant"] = new Proxy(dictionaries.zh, {
    get(dictionary, key) {
      const value = dictionary[key];
      return typeof value === "string" ? traditional(value) : value;
    },
  });
  delete dictionaries.zh;

  const savedLocale = localStorage.getItem(STORAGE_KEY);
  let current = savedLocale === "en" || savedLocale === "zh-Hant" ? savedLocale : "zh-Hans";

  const isChinese = () => current.startsWith("zh");
  const localizeChinese = (value) => current === "zh-Hant" ? traditional(value) : String(value ?? "");

  function interpolate(value, variables = {}) {
    return Object.entries(variables).reduce((text, [key, replacement]) => text.replaceAll(`{${key}}`, replacement), value);
  }

  function t(key, variables) {
    const value = dictionaries[current][key] ?? dictionaries["zh-Hans"][key] ?? key;
    return interpolate(value, variables);
  }

  function translate(root = document) {
    document.documentElement.lang = current === "zh-Hans" ? "zh-CN" : current === "zh-Hant" ? "zh-Hant" : "en";
    root.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
    root.querySelectorAll("[data-i18n-html]").forEach((element) => { element.innerHTML = t(element.dataset.i18nHtml); });
    root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
    root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => { element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel)); });
    root.querySelectorAll("[data-i18n-content]").forEach((element) => { element.setAttribute("content", t(element.dataset.i18nContent)); });
    root.querySelectorAll("[data-lang]").forEach((button) => {
      const active = button.dataset.lang === current;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setLocale(locale) {
    if (!dictionaries[locale] || locale === current) return;
    current = locale;
    localStorage.setItem(STORAGE_KEY, current);
    translate();
    window.dispatchEvent(new CustomEvent("cocktail-locale-change", { detail: { locale: current } }));
  }

  function bind() {
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => setLocale(button.dataset.lang));
    });
  }

  window.CocktailLocale = {
    t,
    translate,
    setLocale,
    pick(zh, en) { return isChinese() ? localizeChinese(zh) : en; },
    zh: localizeChinese,
    toTraditional: traditional,
    get isChinese() { return isChinese(); },
    get isTraditional() { return current === "zh-Hant"; },
    get languageTag() { return current === "zh-Hans" ? "zh-CN" : current === "zh-Hant" ? "zh-Hant" : "en"; },
    get current() { return current; },
  };

  translate();
  bind();
})();
