from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:8765/cocktail-atlas/order.html"
OUTPUT = Path("/private/tmp/cocktail-atlas-poetry-qa")
OUTPUT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto(BASE_URL, wait_until="networkidle")

    for locale, query, recipe_id, filename in [
        ("zh-Hans", "Mojito", "11000", "mojito-simplified.png"),
        ("zh-TW", "Mojito", "11000", "mojito-traditional.png"),
        ("en", "Negroni", "11003", "negroni-english.png"),
    ]:
        page.locator(f'[data-lang="{locale}"]').click()
        page.locator("#order-search").fill(query)
        page.wait_for_timeout(250)
        card = page.locator(f'.order-menu-item:has([data-add-id="{recipe_id}"])')
        card.screenshot(path=str(OUTPUT / filename))

    browser.close()
    print(f"Poetry QA screenshots: {OUTPUT}")
