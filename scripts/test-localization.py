from pathlib import Path
from playwright.sync_api import sync_playwright, expect


BASE_URL = "http://127.0.0.1:8765/cocktail-atlas/"
SCREENSHOT_DIR = Path("/private/tmp/cocktail-atlas-locale-qa")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def assert_no_horizontal_overflow(page):
    dimensions = page.evaluate(
        """() => ({
            viewport: document.documentElement.clientWidth,
            content: document.documentElement.scrollWidth
        })"""
    )
    assert dimensions["content"] <= dimensions["viewport"], dimensions


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    errors = []
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))

    page.goto(BASE_URL, wait_until="networkidle")
    expect(page.locator("html")).to_have_attribute("lang", "zh-CN")
    expect(page.locator("#hero-title")).to_contain_text("把吧台")
    page.locator("#recipe-search").fill("莫吉托")
    page.wait_for_timeout(250)
    mojito_card = page.locator('.recipe-card:has(.recipe-open[data-id="11000"])')
    expect(mojito_card.locator(".localized-name")).to_have_text("莫吉托")
    expect(mojito_card.locator(".original-name")).to_have_text("Mojito")
    assert_no_horizontal_overflow(page)
    page.screenshot(path=str(SCREENSHOT_DIR / "recipes-zh.png"), full_page=True)

    page.locator('[data-lang="zh-Hant"]').click()
    expect(page.locator("html")).to_have_attribute("lang", "zh-Hant")
    expect(page.locator("#hero-title")).to_contain_text("吧臺")
    expect(mojito_card.locator(".localized-name")).to_have_text("莫吉託")

    page.locator('[data-lang="en"]').click()
    expect(page.locator("html")).to_have_attribute("lang", "en")
    expect(page.locator("#hero-title")).to_contain_text("The whole bar")
    expect(page.locator("#recipe-search")).to_have_attribute("placeholder", "Try Mojito, gin, or coffee")
    expect(mojito_card.locator(".localized-name")).to_have_text("Mojito")
    expect(mojito_card.locator(".original-name")).to_have_count(0)
    mojito_card.locator(".recipe-open").click()
    expect(page.locator("#dialog-title .localized-name")).to_have_text("Mojito")
    expect(page.locator("#dialog-title .original-name")).to_have_count(0)
    expect(page.locator(".instruction")).to_contain_text("Muddle mint leaves")
    page.get_by_role("button", name="Close recipe details").click()
    assert_no_horizontal_overflow(page)
    page.screenshot(path=str(SCREENSHOT_DIR / "recipes-en.png"), full_page=True)

    page.reload(wait_until="networkidle")
    expect(page.locator("html")).to_have_attribute("lang", "en")
    expect(page.locator("#hero-title")).to_contain_text("The whole bar")

    page.goto(f"{BASE_URL}order.html", wait_until="networkidle")
    expect(page.locator("html")).to_have_attribute("lang", "en")
    expect(page.get_by_role("heading", name="What are we drinking tonight?")).to_be_visible()
    page.locator("#order-search").fill("Mojito")
    page.wait_for_timeout(250)
    order_mojito = page.locator('.order-menu-item:has([data-add-id="11000"])')
    expect(order_mojito.locator(".original-name")).to_have_count(0)
    expect(order_mojito.locator(".poem-original")).to_have_attribute("lang", "es")
    expect(order_mojito.locator(".poem-translation")).to_have_text("青柠触到冰时，薄荷便醒来。")
    order_mojito.locator("[data-add-id]").click()
    expect(page.locator(".selected-drink .localized-name")).to_have_text("Mojito")
    expect(page.locator(".selected-drink .original-name")).to_have_count(0)
    page.get_by_role("button", name="Confirm order").click()
    expect(page.get_by_role("heading", name="Your order is noted.")).to_be_visible()
    expect(page.locator(".confirmation-list .localized-name")).to_have_text("Mojito")
    expect(page.locator(".confirmation-list .original-name")).to_have_count(0)
    page.get_by_role("button", name="Close confirmation").click()

    page.locator('[data-lang="zh-Hant"]').click()
    expect(page.locator("html")).to_have_attribute("lang", "zh-Hant")
    expect(page.locator("#order-title")).to_contain_text("今晚")
    expect(page.locator(".selected-drink .localized-name")).to_have_text("莫吉託")

    page.locator('[data-lang="zh-Hans"]').click()
    expect(page.locator("html")).to_have_attribute("lang", "zh-CN")
    expect(page.locator("#order-title")).to_contain_text("今晚")
    expect(page.locator(".selected-drink .localized-name")).to_have_text("莫吉托")
    expect(page.locator(".selected-drink .original-name")).to_have_text("Mojito")
    assert_no_horizontal_overflow(page)
    page.screenshot(path=str(SCREENSHOT_DIR / "order-zh.png"), full_page=True)

    context.close()
    browser.close()
    assert not errors, errors
    print("PASS: Simplified + Traditional Chinese, English-only names, persisted locale, localized order flow, and mobile overflow")
    print(f"Screenshots: {SCREENSHOT_DIR}")
