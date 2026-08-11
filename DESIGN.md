# Yahua Ink Design System

Status: current implementation baseline, verified against the shipped HTML, CSS, JavaScript, product context, and final review captures on 2026-08-11. Use this document to extend the existing site; it does not propose a redesign. `style.css`, `site.js`, and `i18n.js` remain the executable sources of truth.

## 1. Design thesis and own-world

**Thesis:** Flexible packaging film becomes a precise, moving canvas for ink engineering.

The site should feel native to an ink laboratory and production line. Drawdown tests, registration bars, substrate notation, translucent film layers, colour overlap, film rolls, measured rules, and compact technical labels form one coherent visual language. The first viewport pairs direct product language with a wide film sheet carrying overlapping ink fields and a clear product-selection action.

The formal character is coated-stock warmth, ink-black typography, saturated process colours, clipped film geometry, hard rules, and deliberately sparse data labels. Motion should suggest viscous ink and rolling film, not generic interface animation.

Do not imitate the surface appearance with unrelated gradient blobs, paint splashes, rounded SaaS cards, glossy 3D objects, lifestyle imagery, or a generic “industrial” stock-photo treatment. Colour effects only belong when they describe ink, substrate, transfer, registration, measurement, or documentation.

Authentic documentary photography should be used only when verified assets are supplied. Until then, use the current abstract, materially grounded visual system; never fabricate factory, laboratory, team, customer, product, or packaging photography.

## 2. Content and story order

Every page should help a technical buyer answer, in order: what Yahua makes, which series fits the substrate and press, whether production depth is credible, and which source documents are available.

- Home: material expertise and direct selection action → five-series route → production-scale register → R&D/drawdown evidence → document room.
- Products: choose by substrate and confirm by process → filter and compare all series → retain the qualification disclaimer.
- Company: company identity → connected portfolio and R&D → scale with control → Health / Green / Safety values → recognition routed to documents.
- Resources: document purpose → available source files with open/download/preview paths → explicit availability and scope caution.
- Product detail: breadcrumb → series proposition and MSDS/compare actions → process/substrate/performance facts → three evidence chapters → next-series route.

Do not lead with awards, unsupported sustainability language, or an abstract company story before product fit. Evidence and source-document access should follow claims closely.

## 3. Colour

Use the existing CSS custom properties; do not introduce near-duplicate colours.

| Token | Value | Current role and contrast rule |
| --- | --- | --- |
| `--stock` | `#f2f0e9` | Main coated-stock ground. `--ink` is 16.47:1 and `--ink-soft` is 7.05:1 on this surface. |
| `--stock-deep` | `#e7e4da` | Secondary neutral, language hover, and scrollbar track; not a primary text colour. |
| `--paper` | `#fbfaf6` | Film, sheet, document, and light-action surface. It is 17.98:1 against `--ink`. |
| `--ink` | `#111211` | Primary type, strong rules, dark actions, production registers, and footer. |
| `--ink-soft` | `#4f514c` | Body copy and secondary labels on light neutrals only. |
| `--rule` | `#c9c6bc` | Structural rails and dividers. Its low contrast is intentional; never use it for text or as the sole boundary of an interactive control. |
| `--coral` | `#ed594f` | ZXA-59. Use `--ink` text (5.49:1), not white body text. |
| `--violet` | `#6046ff` | ZXA-63, selection, and document CTA. Use white/`--paper` text (about 5.5:1), not `--ink` for normal text. |
| `--cyan` | `#00a4b8` | ZXA-68 and document caution. Use `--ink` text (6.26:1). |
| `--lime` | `#a3bd2d` | ZXA-78. Use `--ink` text (8.83:1). |
| `--gold` | `#d2a020` | ZXA-88 and recognition. Use `--ink` text (7.86:1). |
| `--focus` | `#005fcc` | Default 3px focus ring with 4px offset; 5.25:1 against `--stock`. Coloured sections use the authored paper-outline plus ink-ring treatment. |

Dark registers use the existing literal `#50524d` for internal rules, `#b4b7b0` for labels, and `#92958f` for footer metadata. Preserve these as secondary information, not primary copy.

Product pages set `--series` and `--series-deep` on `<body>`: ZXA-59 `#ed594f` / `#9d2824`; ZXA-63 `#6046ff` / `#301bb0`; ZXA-68 `#00a4b8` / `#006c7a`; ZXA-78 `#a3bd2d` / `#66791a`; ZXA-88 `#d2a020` / `#8b6412`. `--series-foreground` is `--ink` for 59, 68, 78, and 88; ZXA-63 keeps the default white.

## 4. Typography

- `--display`: **Yahua Archivo** variable, then Helvetica Neue/sans-serif. Use for headings and the brand wordmark. Headings use weight 760, line-height `.98`, letter-spacing `-.035em`, and balanced wrapping.
- `--body`: **Yahua Archivo** with Noto Sans SC, PingFang SC, and Microsoft YaHei fallbacks. Body line-height is `1.55`, paragraph measure is capped at `72ch`, and supporting text uses `--ink-soft`.
- `--measure`: **Yahua Mono** / IBM Plex Mono with system monospace fallbacks. Use for series codes, substrate/process notation, document IDs, axes, breadcrumbs, and compact uppercase data labels—not long prose.
- `h1`: `clamp(3.6rem, 7.8vw, 6rem)`; `h2`: `clamp(2.25rem, 4.7vw, 4.6rem)`; `h3`: `clamp(1.35rem, 2.3vw, 2rem)`. Product-detail `h1` uses `clamp(3.2rem, 6.2vw, 5.7rem)`. Breakpoint overrides are defined below.

For Arabic, `html[lang="ar"]` switches both display and body roles to **Yahua Arabic** / Noto Kufi Arabic. Do not force Archivo onto Arabic prose or headings. Technical codes remain monospace and LTR-isolated. Let translations reflow; do not hard-code English line breaks into translated copy.

## 5. Layout, spacing, and finish

`--content` is the page rail: `min(100% - 48px, 1440px)` on desktop, `min(100% - 28px, 1440px)` at 860px and below, and `calc(100% - 20px)` at 620px and below. Major sections sit inside this rail, commonly with 1px inline borders, so the site reads as one continuous production sheet rather than a stack of cards.

Desktop hero and evidence sections use asymmetric two-column grids, generally near 1.1/0.9. Product registers use repeated columns; narrative sections pair one strong heading with a constrained evidence block. Use logical properties (`margin-inline`, `padding-inline`, `border-inline`) whenever direction can change.

There is no abstract spacing-token scale in the current code. Extend its established rhythm:

- page/section inline padding: fluid `24px`–`84px`; mobile `20px`;
- major vertical sections: roughly `70px`–`180px`, expressed with `clamp()`;
- paired content gaps: roughly `44px`–`120px` desktop, collapsing to `28px`–`60px`;
- compact control gaps: `4px`–`16px`; action group gap `16px 28px`.

Borders are normally 1px `--rule` for page structure and 1px `--ink` for selectors, tests, and strong separations. Corners stay square. Reserve `border-radius: 99px` for filter/language pills and circles/ellipses for physical motifs such as rolls, marks, menisci, or ink deposits. Do not turn content regions into rounded cards.

Elevation is sparse and material-specific: raised film (`28px 44px 56px rgba(17,18,17,.18)`), document sheets (`20px 28px 38px rgba(17,18,17,.14)`), dark action (`0 10px 22px rgba(17,18,17,.16)`), and light action (`0 10px 24px rgba(0,0,0,.18)`). Flat registers and content rows should remain unshadowed.

## 6. Core visual motifs

- **Film layers:** clipped, translucent polygons with edge rules, overprint blending, registration marks, substrate codes, and controlled shadow.
- **Ink field / meniscus:** multiply-blended process-colour fields under film, grounded by a dark viscous edge.
- **Drawdown test:** three overlapping measured deposits on a physical sheet with a mono scale.
- **Registration/data register:** strict rules, tabular figures, uppercase mono labels, and aligned definitions.
- **Swatch fan:** one chip per current series, shown as a technical material set rather than a decorative rainbow.
- **Film roll and bands:** product-specific colour, roll core, clipped layers, and a terse film/process label.
- **Document sheets:** source-document metaphor with file type, language, and restrained linework.

Decorative motifs must be `aria-hidden="true"`; they cannot carry the only instance of product information.

## 7. Component patterns

### Navigation

`site.js` injects a shared `.site-nav` and footer. The desktop nav is 82px high with brand, four primary destinations, an `aria-current="page"` underline, and language pills. At 860px it becomes a 72px header plus a full-screen dark panel. The menu locks body scroll, makes main/footer inert, moves focus into the panel, traps Tab, closes on Escape or resize above 860px, and restores focus. Preserve this behavior and the translated `aria-label` hooks.

### Actions

Use `.action-dark` for the primary decision, `.action-outline` for lower-emphasis comparison, `.action-light` on saturated/dark fields, and `.text-link` for source or secondary routes. Actions are rectangular, at least 52px high (`.text-link` 44px), and use verb-led labels. A section should normally have one dominant action.

### Product lines and selector

Home `.product-line` rows show series, name, process/substrate shorthand, and directional arrow; the whole row is the link. Hover/focus fills the row with its series colour. The catalog selector presents series, plain-language purpose, substrate, process, and View within one anchor. Process filters are buttons with `aria-pressed`; filtered rows use `hidden`, and an empty state exists. Always retain the qualification note below the selector.

### Production register

Use semantic `<dl>` groups, mono uppercase `<dt>` labels, large tabular `<dd>` values, and hard internal rules on `--ink`. Only state verified values. The current proof points are 30,000+ m², 30,000+ tons annual capacity, gravure/flexo systems, and Zhangzhou, Fujian.

### Film stage

The home stage combines an `aria-hidden` canvas, two clipped sheets, registration marks, LTR-isolated technical notation, and a meniscus. It is an explanatory material atmosphere, never a chart. Pointer tilt only runs for fine pointers and when reduced motion is not requested.

### Product detail

Add the page class `.page-product`, a unique product class, and body-level `--series` / `--series-deep`. Keep the established sequence: breadcrumb, split hero, MSDS plus comparison actions, three-column facts `<dl>`, performance introduction, three evidence chapters, and next-series CTA. Each visual chapter is decorative; its adjacent heading and paragraph must contain the meaning.

### Documents

Each `.document-row` contains a stable file ID, title/description/revision note, direct open and download actions, and an optional native `<details>` preview with a titled lazy-loaded iframe. Link to the supplied source file; distinguish an optimized preview from the download source. End the page with the availability/scope caution.

### Footer

Use the shared dark footer: brand and restrained capability line, two-column product/company/document links, then mono legal/location metadata separated by a rule. Do not add unverified phone, email, office, distributor, or social details.

## 8. Motion and interaction

The primary easing token is `--ease-out: cubic-bezier(.16, 1, .3, 1)`. Typical durations are `.25s`–`.35s` for colour/control feedback, `.4s`–`.58s` for arrows and row fills, and `.9s` for film tilt. Keep movement short, weighted, and physically directional:

- actions lift 2px and strengthen their shadow;
- nav underline grows from the reading-start edge;
- product rows fill vertically like a drawdown; selector tint enters from reading start;
- arrows move outward/up and mirror in RTL;
- mobile navigation reveals with a clipped sheet (`.55s`) and opacity (`.35s`);
- the canvas slowly shifts multiply-blended radial ink fields; film layers tilt only on fine-pointer movement.

Every interactive state needs default, hover where applicable, keyboard focus, active/current/pressed where applicable, and disabled/hidden behavior if introduced. Under `prefers-reduced-motion: reduce`, smooth scroll is removed and all animation/transition durations collapse to `.01ms`; JavaScript draws one static canvas frame and skips pointer tilt.

## 9. Responsive behavior

- **≤1100px:** home split tightens; production register becomes 2×2; selectors drop the process column; document rows narrow.
- **≤860px:** page rail becomes 28px total inset; navigation becomes the contained full-screen menu; all major split heroes, scale field, and lab story stack; paired section headings stack; product selector hides both data columns; product film follows copy; chapter rows remain two-column; `h1` becomes `clamp(3rem, 12vw, 5.4rem)` and `h2` becomes `clamp(2.15rem, 8vw, 4rem)`.
- **≤620px:** page rail becomes 20px total inset; paragraphs use `.97rem/1.65`; `h1` becomes `clamp(2.85rem, 13vw, 4.4rem)` and product `h1` becomes `clamp(2.8rem, 12vw, 4.2rem)`; hero actions become full-width; registers and facts become single-column; product-line process shorthand is hidden; selector summaries are reduced to series/name/arrow; document rows and performance chapters become single-column; footer stacks.

Mobile is a deliberate editorial reorder, not a scaled desktop. Preserve the reading sequence: proposition → action → material visual → facts/evidence. Never let decoration force body text below a legible size.

## 10. Localization, RTL, and bidi

Supported languages are English, Simplified Chinese, Russian, and Arabic. `i18n.js` sets `lang`, sets `dir="rtl"` only for Arabic, translates visible copy, page titles, and registered accessible names, updates language-button `aria-pressed`, and persists `yahua_lang` in local storage with browser-language fallback.

All new user-facing copy needs keys in every language and English fallback behavior. Add `data-i18n-aria-label` wherever an accessible name is translated; visible translation alone is not sufficient. Use logical CSS properties and allow grid/flex direction to follow the root direction. Do not create a separate Arabic DOM.

Series codes, substrate abbreviations, film/document IDs, and the final breadcrumb token must remain `direction:ltr; unicode-bidi:isolate`. Material diagrams (`film-sheet-front`, drawdown sheet, document stack, brand orbit) remain internally LTR. RTL nav/selector fills originate from the right and directional arrows mirror. Middle East readiness here means authored Arabic/RTL behavior only; it is not evidence of a Middle East office, distributor, certification, or current market operation.

## 11. Accessibility and product-truth guardrails

- Keep one clear page `h1`, labelled sections, semantic lists/definition lists, real links/buttons, and native `<details>` where used.
- Keep decorative imagery and canvases hidden from assistive technology; meaningful images require concise, translated alternatives.
- Preserve the global 3px `--focus` ring and the stronger light-outline/dark-halo treatment on saturated sections. Never remove outlines without an equivalent visible focus state.
- Preserve mobile menu focus containment, Escape close, focus return, `inert` background, scroll lock, and 44px-or-larger control targets.
- Keep `aria-current`, filter and language `aria-pressed`, iframe titles, external-link `rel="noopener"`, and translated navigation/filter/product-overview labels.
- Test keyboard-only, reduced motion, 320px-class mobile layouts, all four languages, and Arabic RTL after every new component.
- Treat `PRODUCT.md` and supplied source documents as factual boundaries. Use qualifiers such as “stated,” “supplied brief,” and “available files” where the implementation does.

Current product truth:

| Series | Process | Verified substrate/application scope |
| --- | --- | --- |
| ZXA-59 | Water-based gravure | Coated, light-coated, and sheet paper |
| ZXA-63 | Water-based gravure | PVC and PETG shrink films |
| ZXA-68 | Gravure surface printing | PE, OPP, CPP, PET, pearlescent film, metallized film, and aluminium foil |
| ZXA-78 | Water-based flexographic surface | Paper and multiple plastic films/foil; customisation is stated as available |
| ZXA-88 | Gravure reverse-printing lamination | PE, OPP, and PET |

Do not infer “water-based” for a series unless its supplied source says so. Direct handling, safety, and qualification decisions to the current MSDS. Contact, market, distributor, customer, certification scope/identifier, and regional-operation claims must not be invented. Certification references must remain high-level unless a verified certificate supplies exact scope and identifiers.

## 12. Checklist: add a page or product series

- [ ] Confirm ownership and facts against `PRODUCT.md` and supplied source documents; identify every unknown explicitly.
- [ ] Place the page in the established story order and reuse the shared injected header/footer.
- [ ] Add a unique, concise `h1`, metadata/title key, labelled sections, and one clear primary action.
- [ ] Reuse `--content`, existing type roles, square rails, spacing rhythm, and an ink-specific motif with adjacent textual meaning.
- [ ] For a product, set tested `--series`, `--series-deep`, and readable foreground; add selector/home rows, verified process/substrates/profile, MSDS route, chapters, and next-series route.
- [ ] Add English, Chinese, Russian, and Arabic copy plus translated accessible-name keys; isolate codes and test bidi behavior.
- [ ] Author default, hover, focus, current/pressed, mobile, RTL, and reduced-motion states.
- [ ] Check contrast, 44px targets, focus order/containment, heading hierarchy, semantic controls, and decorative `aria-hidden` use.
- [ ] Verify at desktop, ≤1100px, ≤860px, and ≤620px, including long Russian/Arabic copy and a 320px-class viewport.
- [ ] Use authentic documentary photography only when verified assets are supplied. Do not add unverified contacts, markets, operations, customers, performance, capacity, safety, or certification claims.
