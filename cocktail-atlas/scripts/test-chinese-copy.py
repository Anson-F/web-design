#!/usr/bin/env python3
"""Guard contemporary Chinese bar terminology against literal translation regressions."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
payload = json.loads((ROOT / "data" / "recipes.json").read_text())
recipes = payload["recipes"]
instructions = json.loads((ROOT / "data" / "instruction-zh.json").read_text())
terms_script = (ROOT / "cocktail-terms.js").read_text()
app_script = (ROOT / "app.js").read_text()
order_script = (ROOT / "order.js").read_text()
index_html = (ROOT / "index.html").read_text()
order_html = (ROOT / "order.html").read_text()

assert len(recipes) == len(instructions) == 441
assert all(recipe["instructions"]["zh"] == instructions[recipe["id"]] for recipe in recipes)

copy = "\n".join(f"{recipe['nameZh']}\n{recipe['instructions']['zh']}" for recipe in recipes)
for forbidden in (
    "射手", "射击", "每人一枪", "老式玻璃杯", "岩石玻璃杯", "岩石杯",
    "滋补品", "楔形物", "玻璃搅拌器", "鸡尾酒调酒器", "糖醋", "喝醉",
):
    assert forbidden not in copy, f"Literal translation leaked into Chinese copy: {forbidden}"

by_name = {recipe["name"]: recipe for recipe in recipes}
assert "shot 杯" in by_name["110 in the shade"]["instructions"]["zh"]
assert "shot 杯" in by_name["252"]["instructions"]["zh"]
assert "一口饮下" in by_name["252"]["instructions"]["zh"]
assert by_name["Gin Cooler"]["nameZh"] == "金酒酷乐"
assert by_name["Spritz"]["nameZh"] == "斯普里兹"
assert by_name["Wine Cooler"]["nameZh"] == "葡萄酒酷乐"
assert by_name["Jello shots"]["nameZh"] == "果冻 shot"

for token in ('"gin": "金酒"', '"tonic water": "汤力水"', '"lime": "青柠"'):
    assert token in terms_script
assert re.search(r'\[/\\bshots\?\\b/gi, "shot"\]', terms_script)

version = "20260813-title-up-1"
assert f'recipes.json?v=${{BUILD_VERSION}}' in app_script
assert f'recipes.json?v=${{BUILD_VERSION}}' in order_script
assert all(f"?v={version}" in source for source in (index_html, order_html))
for asset in ("styles.css", "traditional-map.js", "locale.js", "cocktail-terms.js", "app.js"):
    assert f'{asset}?v={version}' in index_html
for asset in ("styles.css", "order.css", "traditional-map.js", "locale.js", "cocktail-terms.js", "order.js"):
    assert f'{asset}?v={version}' in order_html

print("PASS: 441 contemporary Chinese instructions, protected shot terminology, curated bar vocabulary, and cache-busted assets")
