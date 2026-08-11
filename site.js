(function () {
  const header = document.querySelector("[data-site-header]");
  const footer = document.querySelector("[data-site-footer]");

  if (header) {
    header.className = "site-nav";
    header.innerHTML = `
      <a class="brand" href="index.html" aria-label="Yahua Ink home" data-i18n-aria-label="brand.home">
        <img src="assets/images/yahualogo-color.png" alt="" width="44" height="40">
        <span>YAHUA <b>INK</b></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-navigation">
        <span class="sr-only" data-i18n="nav.menu">Open navigation</span>
        <span aria-hidden="true"></span><span aria-hidden="true"></span>
      </button>
      <div class="nav-panel" id="site-navigation">
        <nav class="primary-nav" aria-label="Primary navigation" data-i18n-aria-label="nav.primary">
          <a href="index.html" data-i18n="nav.home">Home</a>
          <a href="products.html" data-i18n="nav.products">Products</a>
          <a href="about.html" data-i18n="nav.about">Company</a>
          <a href="resources.html" data-i18n="nav.resources">Documents</a>
        </nav>
        <div class="language-switcher" aria-label="Language" data-i18n-aria-label="nav.language">
          <button type="button" class="lang-btn" data-lang="zh">中文</button>
          <button type="button" class="lang-btn" data-lang="en">EN</button>
          <button type="button" class="lang-btn" data-lang="ru">РУ</button>
          <button type="button" class="lang-btn" data-lang="ar">ع</button>
        </div>
      </div>`;
  }

  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="footer-brand">
        <a class="brand brand-footer" href="index.html" aria-label="Yahua Ink home" data-i18n-aria-label="brand.home">
          <img src="assets/images/yahualogo-color.png" alt="" width="44" height="40">
          <span>YAHUA <b>INK</b></span>
        </a>
        <p data-i18n="footer.tagline">Water-based ink systems for paper and flexible packaging.</p>
      </div>
      <nav class="footer-nav" aria-label="Footer navigation" data-i18n-aria-label="footer.navigation">
        <a href="products.html" data-i18n="nav.products">Products</a>
        <a href="about.html" data-i18n="nav.about">Company</a>
        <a href="resources.html#technical" data-i18n="footer.msds">MSDS</a>
        <a href="resources.html#compliance" data-i18n="footer.compliance">Compliance</a>
      </nav>
      <div class="footer-meta">
        <span>© <span data-current-year></span> Yahua (Fujian) Ink Technology Co., Ltd.</span>
        <span data-i18n="footer.location">Zhangzhou · Fujian · China</span>
      </div>`;
  }

  document.querySelectorAll("[data-current-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".primary-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    const isProductDetail = current.startsWith("product-zxa-") && href === "products.html";
    if (href === current || isProductDetail) link.setAttribute("aria-current", "page");
  });

  const toggle = document.querySelector(".nav-toggle");
  const panel = document.querySelector(".nav-panel");
  if (toggle && panel) {
    const backgroundRegions = [document.querySelector("main"), footer].filter(Boolean);
    const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const menuIsOpen = () => toggle.getAttribute("aria-expanded") === "true";
    const setMenuState = (open, returnFocus = false) => {
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
      backgroundRegions.forEach((region) => { region.inert = open; });
      if (open) {
        window.requestAnimationFrame(() => panel.querySelector(focusableSelector)?.focus());
      } else if (returnFocus) {
        toggle.focus();
      }
    };
    toggle.addEventListener("click", () => {
      setMenuState(!menuIsOpen(), menuIsOpen());
    });
    panel.querySelectorAll("a, .lang-btn").forEach((control) => {
      control.addEventListener("click", () => setMenuState(false, control.matches(".lang-btn")));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuIsOpen()) {
        setMenuState(false, true);
      }
      if (event.key === "Tab" && menuIsOpen()) {
        const focusable = [...panel.querySelectorAll(focusableSelector)];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860 && menuIsOpen()) setMenuState(false);
    });
  }

  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const selectorRows = [...document.querySelectorAll("[data-process]")];
  const emptyState = document.querySelector("[data-product-empty]");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let visibleCount = 0;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      selectorRows.forEach((row) => {
        const visible = filter === "all" || row.dataset.process === filter;
        row.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      if (emptyState) emptyState.hidden = visibleCount !== 0;
    });
  });

  const stage = document.querySelector("[data-film-stage]");
  if (stage && window.matchMedia("(pointer:fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stage.style.setProperty("--film-x", `${x * 7}deg`);
      stage.style.setProperty("--film-y", `${y * -5}deg`);
    });
    stage.addEventListener("pointerleave", () => {
      stage.style.setProperty("--film-x", "0deg");
      stage.style.setProperty("--film-y", "0deg");
    });
  }

  function startInkField() {
    const canvas = document.getElementById("ink-field");
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const colors = ["#ed594f", "#6046ff", "#00a4b8", "#d2a020"];
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "multiply";
      colors.forEach((color, index) => {
        const phase = reduced ? index * 0.8 : time * 0.00022 + index * 1.4;
        const x = width * (0.28 + index * 0.16) + Math.sin(phase) * width * 0.075;
        const y = height * (0.4 + (index % 2) * 0.18) + Math.cos(phase * 1.25) * height * 0.08;
        const radius = Math.max(width, height) * (0.28 + index * 0.015);
        const gradient = context.createRadialGradient(x, y, radius * 0.08, x, y, radius);
        gradient.addColorStop(0, `${color}f2`);
        gradient.addColorStop(0.48, `${color}a8`);
        gradient.addColorStop(1, `${color}00`);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalCompositeOperation = "source-over";
      if (!reduced) frame = window.requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    window.addEventListener("resize", resize);
    window.addEventListener("pagehide", () => window.cancelAnimationFrame(frame), { once: true });
  }

  startInkField();
})();
