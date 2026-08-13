#!/usr/bin/env python3
"""Visual and geometric regression checks for editorial recipe spreads."""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import sync_playwright, expect


BASE_URL = "http://127.0.0.1:8765/cocktail-atlas/"
SCREENSHOT_DIR = Path("/private/tmp/cocktail-atlas-recipe-spreads")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

CASES = (
    ("110 in the shade", "15423", "reference"),
    ("Empellón Cocina's Fat-Washed Mezcal", "17246", "long-title"),
    ("Egg Nog #4", "12910", "eleven-ingredients"),
)


def assert_inside(inner: dict, outer: dict) -> None:
    assert inner["x"] >= outer["x"] - 1, (inner, outer)
    assert inner["y"] >= outer["y"] - 1, (inner, outer)
    assert inner["x"] + inner["width"] <= outer["x"] + outer["width"] + 1, (inner, outer)
    assert inner["y"] + inner["height"] <= outer["y"] + outer["height"] + 1, (inner, outer)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    errors: list[str] = []
    for viewport_name, viewport in (("mobile", {"width": 390, "height": 844}), ("desktop", {"width": 1440, "height": 1000})):
        context = browser.new_context(viewport=viewport)
        page = context.new_page()
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(BASE_URL, wait_until="networkidle")

        for query, recipe_id, slug in CASES:
            page.locator("#recipe-search").fill(query)
            page.wait_for_timeout(250)
            card = page.locator(f'.recipe-card:has(.recipe-open[data-id="{recipe_id}"])')
            expect(card).to_be_visible()
            poster = card.locator(".recipe-poster")
            title = card.locator(".recipe-poster-title")
            formula = card.locator(".recipe-formula")
            rows = card.locator(".recipe-formula-row")
            expect(rows).not_to_have_count(0)

            card_box = card.bounding_box()
            poster_box = poster.bounding_box()
            title_box = title.bounding_box()
            formula_box = formula.bounding_box()
            assert card_box and poster_box and title_box and formula_box
            assert_inside(title_box, poster_box)
            assert_inside(formula_box, card_box)
            if viewport_name == "desktop":
                assert formula_box["x"] > poster_box["x"] + poster_box["width"], (poster_box, formula_box)
                assert rows.count() == page.locator(f'.recipe-card:has(.recipe-open[data-id="{recipe_id}"]) .recipe-formula-row').count()
            else:
                assert formula_box["y"] > poster_box["y"] + poster_box["height"], (poster_box, formula_box)

            card.screenshot(path=str(SCREENSHOT_DIR / f"{viewport_name}-{slug}.png"))

        if viewport_name == "desktop":
            page.locator("#recipe-search").fill("")
            page.wait_for_timeout(250)
            load_more = page.locator("#load-more")
            while load_more.is_visible():
                load_more.click()
            expect(page.locator(".recipe-card")).to_have_count(441)
            failures = page.evaluate(
                """() => [...document.querySelectorAll('.recipe-card')].flatMap((card) => {
                    const poster = card.querySelector('.recipe-poster').getBoundingClientRect();
                    const title = card.querySelector('.recipe-poster-title').getBoundingClientRect();
                    const formula = card.querySelector('.recipe-formula').getBoundingClientRect();
                    const inside = title.left >= poster.left - 1 && title.top >= poster.top - 1
                      && title.right <= poster.right + 1 && title.bottom <= poster.bottom + 1;
                    const beside = formula.left > poster.right;
                    return inside && beside ? [] : [{ id: card.querySelector('.recipe-open').dataset.id, inside, beside }];
                })"""
            )
            assert not failures, failures

        context.close()

    browser.close()
    assert not errors, errors
    print("PASS: all 441 desktop spreads plus mobile reference, longest-title, and 11-ingredient cases stay inside their cards")
    print(f"Screenshots: {SCREENSHOT_DIR}")
