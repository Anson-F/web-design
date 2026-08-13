from pathlib import Path
import re
from playwright.sync_api import sync_playwright, expect


BASE_URL = "http://127.0.0.1:8765/cocktail-atlas/"
SCREENSHOT_DIR = Path("/private/tmp/cocktail-atlas-order-qa")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)


def assert_no_horizontal_overflow(page):
    dimensions = page.evaluate(
        """() => ({
            viewport: document.documentElement.clientWidth,
            content: document.documentElement.scrollWidth
        })"""
    )
    if dimensions["content"] > dimensions["viewport"]:
        offenders = page.evaluate(
            """() => [...document.querySelectorAll('body *')]
                .map((element) => ({
                    tag: element.tagName,
                    className: element.className || '',
                    left: Math.round(element.getBoundingClientRect().left),
                    right: Math.round(element.getBoundingClientRect().right),
                    width: Math.round(element.getBoundingClientRect().width)
                }))
                .filter((item) => item.right > document.documentElement.clientWidth + 1 || item.left < -1)
                .slice(0, 12)"""
        )
        raise AssertionError({**dimensions, "offenders": offenders})


def assert_no_visible_amounts(page):
    visible_text = page.locator("body").inner_text()
    for marker in ["$", "¥", "￥", "价格", "金额", "结账", "付款"]:
        assert marker not in visible_text, marker


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    errors = []

    mobile = browser.new_context(viewport={"width": 390, "height": 844})
    mobile.grant_permissions(["clipboard-read", "clipboard-write"], origin="http://127.0.0.1:8765")
    page = mobile.new_page()
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{BASE_URL}order.html", wait_until="networkidle")

    expect(page.get_by_role("heading", name="今晚， 想喝哪一杯？")).to_be_visible()
    expect(page.locator("#order-results-status")).to_contain_text("酒单共 441 款")
    expect(page.locator(".order-menu-item")).to_have_count(32)
    expect(page.locator(".drink-poem")).to_have_count(32)
    expect(page.locator(".drink-poem figcaption a").first).to_have_attribute("href", re.compile(r"^https://"))
    expect(page.get_by_role("button", name="确认点单")).to_be_disabled()
    assert page.locator("#order-menu-list").evaluate("element => getComputedStyle(element).scrollSnapType.includes('x')")
    assert page.locator(".order-menu-item-inner").first.evaluate("element => getComputedStyle(element).aspectRatio === '3 / 5'")
    assert_no_horizontal_overflow(page)
    assert_no_visible_amounts(page)

    page.locator("#order-search").fill("Mojito")
    page.wait_for_timeout(250)
    expect(page.locator(".order-menu-item").first).to_be_visible()
    expect(page.locator('[data-poem-id="11000"] .poem-original')).not_to_be_empty()
    expect(page.locator('[data-poem-id="11000"] figcaption')).not_to_be_empty()
    initial_scroll = page.locator("#order-menu-list").evaluate("element => element.scrollLeft")
    page.get_by_role("button", name="下一张酒卡").click()
    page.wait_for_timeout(500)
    assert page.locator("#order-menu-list").evaluate("element => element.scrollLeft") > initial_scroll
    first_add = page.locator("[data-add-id]").first
    first_add.click()
    first_add.click()
    expect(page.locator(".ticket-title-row")).to_contain_text("2 杯")
    expect(page.locator(".selected-drink")).to_have_count(1)

    page.get_by_role("button", name="清除搜索").click()
    page.locator("#order-search").fill("Negroni")
    page.wait_for_timeout(250)
    page.locator("[data-add-id]").first.click()
    expect(page.locator(".ticket-title-row")).to_contain_text("3 杯")
    expect(page.locator(".selected-drink")).to_have_count(2)

    page.get_by_role("button", name="查看点单纸").click()
    page.locator("#order-note").fill("少甜，不加装饰")
    expect(page.locator("#order-note-count")).to_contain_text("还可输入")

    page.reload(wait_until="networkidle")
    expect(page.locator(".ticket-title-row")).to_contain_text("3 杯")
    expect(page.locator("#order-note")).to_have_value("少甜，不加装饰")

    page.get_by_role("button", name="确认点单").click()
    expect(page.locator("#confirmation-dialog")).to_be_visible()
    expect(page.get_by_role("heading", name="这单， 记好了。")).to_be_visible()
    expect(page.locator(".confirmation-list li")).to_have_count(2)
    page.get_by_role("button", name="复制点单纸").click()
    expect(page.locator(".toast")).to_contain_text("点单纸已复制")
    page.screenshot(path=str(SCREENSHOT_DIR / "mobile-confirmation.png"), full_page=True)
    page.get_by_role("button", name="完成并清空").click()
    expect(page.locator(".ticket-title-row")).to_contain_text("0 杯")

    page.goto(BASE_URL, wait_until="networkidle")
    page.locator("#recipe-search").fill("Mojito")
    page.wait_for_timeout(250)
    page.locator(".recipe-open").first.click()
    page.get_by_role("link", name="加入点单 →").click()
    page.wait_for_load_state("networkidle")
    expect(page).to_have_url(f"{BASE_URL}order.html")
    expect(page.locator(".ticket-title-row")).to_contain_text("1 杯")
    page.get_by_role("button", name="查看点单纸").click()
    page.screenshot(path=str(SCREENSHOT_DIR / "mobile-order.png"), full_page=True)
    assert_no_horizontal_overflow(page)
    mobile.close()

    desktop = browser.new_context(viewport={"width": 1440, "height": 1000})
    page = desktop.new_page()
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{BASE_URL}order.html", wait_until="networkidle")
    expect(page.locator("#order-results-status")).to_contain_text("酒单共 441 款")
    page.locator("[data-add-id]").first.click()
    expect(page.locator(".ticket-title-row")).to_contain_text("1 杯")
    assert_no_horizontal_overflow(page)
    assert_no_visible_amounts(page)
    page.screenshot(path=str(SCREENSHOT_DIR / "desktop-order.png"), full_page=True)
    desktop.close()

    browser.close()
    assert not errors, errors
    print("PASS: horizontal card carousel, sourced verse, search, add, quantity, persistence, note, confirmation, copy, recipe handoff, responsive layout, and no visible amounts")
    print(f"Screenshots: {SCREENSHOT_DIR}")
