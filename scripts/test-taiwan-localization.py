#!/usr/bin/env python3
"""Guard the Taiwan locale against falling back to character-only conversion."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
recipes = json.loads((ROOT / "data" / "recipes.json").read_text())["recipes"]
localized = json.loads((ROOT / "data" / "zh-hant.json").read_text())
by_english_name = {
    recipe["name"]: localized["recipes"][recipe["id"]]
    for recipe in recipes
}

assert localized["locale"] == "zh-TW"
assert len(localized["recipes"]) == len(recipes) == 441

corpus = "\n".join(
    f"{entry['name']}\n{entry['instruction']}"
    for entry in localized["recipes"].values()
)
for mainland_or_literal_term in (
    "金酒", "朗姆", "青檸", "青柠", "湯力", "汤力", "搖酒壺", "摇酒壶",
    "吧勺", "柯林杯", "菠蘿", "菠萝", "西柚", "莫吉託", "莫吉托", "代基里",
    "馬天尼", "马天尼", "射手杯",
):
    assert mainland_or_literal_term not in corpus, mainland_or_literal_term

expected_names = {
    "Mojito": "莫希托",
    "Daiquiri": "黛綺莉",
    "Gin Tonic": "琴通寧",
    "Gin Fizz": "琴費士",
    "Tom Collins": "湯姆可林斯",
    "Dry Martini": "乾馬丁尼",
}
for english_name, taiwan_name in expected_names.items():
    assert by_english_name[english_name]["name"] == taiwan_name

assert "白蘭姆酒" in by_english_name["Mojito"]["instruction"] or "蘭姆酒" in by_english_name["Mojito"]["instruction"]
assert "萊姆" in by_english_name["Mojito"]["instruction"]
assert "琴酒" in by_english_name["Gin Tonic"]["instruction"]
assert "通寧水" in by_english_name["Gin Tonic"]["instruction"]
assert "雪克杯" in by_english_name["Daiquiri"]["instruction"]
assert "可林杯" in by_english_name["Tom Collins"]["instruction"]
assert "shot 杯" in by_english_name["110 in the shade"]["instruction"]

runtime = (ROOT / "traditional-map.js").read_text()
locale = (ROOT / "locale.js").read_text()
index = (ROOT / "index.html").read_text()
order = (ROOT / "order.html").read_text()
assert "window.CocktailTaiwan" in runtime
assert '"金酒":"琴酒"' in runtime
assert '"青柠":"萊姆"' in runtime
assert 'data-lang="zh-TW"' in index and 'data-lang="zh-TW"' in order
assert 'current === "zh-TW"' in locale

print("PASS: 441 recipes use Taiwan cocktail names, ingredients, barware, techniques, and zh-TW runtime metadata")
