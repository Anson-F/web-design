from pathlib import Path
from playwright.sync_api import sync_playwright, expect


BASE_URL = "http://127.0.0.1:8765/cocktail-atlas/"
SCREENSHOT_DIR = Path("/private/tmp/cocktail-atlas-qa-shots")
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
    console_errors = []

    mobile = browser.new_context(viewport={"width": 390, "height": 844})
    mobile.grant_permissions(["clipboard-read", "clipboard-write"], origin="http://127.0.0.1:8765")
    page = mobile.new_page()
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: console_errors.append(str(error)))
    page.goto(BASE_URL, wait_until="networkidle")
    expect(page.get_by_role("heading", name="把吧台， 折进一页索引。")).to_be_visible()
    expect(page.locator("#results-status")).to_contain_text("找到 441 款配方")
    expect(page.locator(".recipe-card")).to_have_count(30)
    assert_no_horizontal_overflow(page)

    page.get_by_role("button", name="IBA 经典").click()
    expect(page.locator("#results-status")).to_contain_text("61 款配方")

    page.locator("#recipe-search").fill("Mojito")
    page.wait_for_timeout(250)
    expect(page.locator("#results-status")).to_contain_text("款配方")
    expect(page.locator(".recipe-card").first).to_be_visible()
    page.locator(".recipe-open").first.click()
    expect(page.locator("#recipe-dialog")).to_be_visible()
    expect(page.locator("#dialog-title")).to_contain_text("Mojito")
    assert page.locator(".ingredient-list li").count() >= 3
    page.get_by_role("button", name="复制配方").click()
    expect(page.locator(".toast")).to_contain_text("配方已复制")
    page.get_by_role("button", name="关闭配方详情").click()

    page.get_by_role("button", name="清除搜索").click()
    page.get_by_role("button", name="无酒精").click()
    expect(page.locator("#results-status")).to_contain_text("40 款配方")
    page.locator("#method-filter").select_option("blend")
    assert page.locator(".recipe-card").count() > 0

    theme = page.get_by_role("button", name="切换明暗主题")
    theme.click()
    assert page.locator("html").get_attribute("data-theme") == "light"
    page.screenshot(path=str(SCREENSHOT_DIR / "mobile.png"), full_page=True)
    mobile.close()

    desktop = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = desktop.new_page()
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: console_errors.append(str(error)))
    page.goto(BASE_URL, wait_until="networkidle")
    expect(page.locator("#results-status")).to_contain_text("找到 441 款配方")
    expect(page.locator(".recipe-card")).to_have_count(30)
    assert_no_horizontal_overflow(page)
    page.screenshot(path=str(SCREENSHOT_DIR / "desktop.png"), full_page=True)
    desktop.close()

    browser.close()
    assert not console_errors, console_errors
    print("PASS: mobile + desktop render, filters, search, dialog, copy, theme, and overflow")
    print(f"Screenshots: {SCREENSHOT_DIR}")
