#!/usr/bin/env python3
"""Build Taiwan Traditional Chinese recipe fields and runtime localization."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECIPES_PATH = ROOT / "data" / "recipes.json"
OUTPUT_PATH = ROOT / "data" / "zh-hant.json"
MAP_PATH = ROOT / "traditional-map.js"

from taiwan_localization import TAIWAN_PHRASES, TAIWAN_POST_PHRASES, TO_TAIWAN, to_taiwan


def main() -> None:
    recipes = json.loads(RECIPES_PATH.read_text())["recipes"]
    localized = {
        recipe["id"]: {
            "name": to_taiwan(recipe.get("nameZh") or recipe["name"]),
            "instruction": to_taiwan(recipe.get("instructions", {}).get("zh") or recipe.get("instructions", {}).get("en", "")),
        }
        for recipe in recipes
    }
    OUTPUT_PATH.write_text(json.dumps({"locale": "zh-TW", "recipes": localized}, ensure_ascii=False, indent=2) + "\n")

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
    mapping = {char: TO_TAIWAN.convert(char) for char in sorted(characters)}
    mapping = {key: value for key, value in mapping.items() if key != value}
    script = (
        "window.CocktailTaiwan = (() => {\n"
        f"  const phrases = {json.dumps(TAIWAN_PHRASES, ensure_ascii=False, separators=(',', ':'))};\n"
        f"  const postPhrases = {json.dumps(TAIWAN_POST_PHRASES, ensure_ascii=False, separators=(',', ':'))};\n"
        f"  const characters = {json.dumps(mapping, ensure_ascii=False, separators=(',', ':'))};\n"
        "  const orderedPhrases = Object.entries(phrases).sort(([a], [b]) => b.length - a.length);\n"
        "  const convert = (value = '') => {\n"
        "    let localized = String(value);\n"
        "    orderedPhrases.forEach(([source, target]) => { localized = localized.split(source).join(target); });\n"
        "    localized = Array.from(localized, (character) => characters[character] || character).join('');\n"
        "    Object.entries(postPhrases).forEach(([source, target]) => { localized = localized.split(source).join(target); });\n"
        "    return localized;\n"
        "  };\n"
        "  return { convert };\n"
        "})();\n"
        "window.CocktailTraditional = window.CocktailTaiwan;\n"
    )
    MAP_PATH.write_text(script)
    print(f"Wrote {len(localized)} zh-TW recipe localizations, {len(TAIWAN_PHRASES)} phrases, and {len(mapping)} character conversions")


if __name__ == "__main__":
    main()
