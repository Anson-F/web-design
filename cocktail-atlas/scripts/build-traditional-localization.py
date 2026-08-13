#!/usr/bin/env python3
"""Build Traditional Chinese recipe fields and a tiny runtime character map."""

from __future__ import annotations

import json
import re
from pathlib import Path

from opencc import OpenCC


ROOT = Path(__file__).resolve().parents[1]
TO_TRADITIONAL = OpenCC("s2t")
RECIPES_PATH = ROOT / "data" / "recipes.json"
OUTPUT_PATH = ROOT / "data" / "zh-hant.json"
MAP_PATH = ROOT / "traditional-map.js"


def main() -> None:
    recipes = json.loads(RECIPES_PATH.read_text())["recipes"]
    localized = {
        recipe["id"]: {
            "name": TO_TRADITIONAL.convert(recipe.get("nameZh") or recipe["name"]),
            "instruction": TO_TRADITIONAL.convert(recipe.get("instructions", {}).get("zh") or recipe.get("instructions", {}).get("en", "")),
        }
        for recipe in recipes
    }
    OUTPUT_PATH.write_text(json.dumps({"locale": "zh-Hant", "recipes": localized}, ensure_ascii=False, indent=2) + "\n")

    source_paths = [
        ROOT / "locale.js",
        ROOT / "app.js",
        ROOT / "order.js",
        ROOT / "cocktail-terms.js",
        ROOT / "index.html",
        ROOT / "order.html",
        RECIPES_PATH,
        ROOT / "data" / "order-quotes.json",
    ]
    characters = set()
    for path in source_paths:
        characters.update(re.findall(r"[\u3400-\u9fff]", path.read_text()))
    mapping = {char: TO_TRADITIONAL.convert(char) for char in sorted(characters)}
    mapping = {key: value for key, value in mapping.items() if key != value}
    script = (
        "window.CocktailTraditional = (() => {\n"
        f"  const characters = {json.dumps(mapping, ensure_ascii=False, separators=(',', ':'))};\n"
        "  const convert = (value = '') => Array.from(String(value), (character) => characters[character] || character).join('');\n"
        "  return { convert };\n"
        "})();\n"
    )
    MAP_PATH.write_text(script)
    print(f"Wrote {len(localized)} recipe localizations and {len(mapping)} character conversions")


if __name__ == "__main__":
    main()
