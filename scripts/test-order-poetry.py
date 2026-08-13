#!/usr/bin/env python3
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
recipes = json.loads((ROOT / "data" / "recipes.json").read_text())["recipes"]
payload = json.loads((ROOT / "data" / "order-poetry.json").read_text())
poems = payload["poems"]

recipe_ids = {recipe["id"] for recipe in recipes}
recipes_by_id = {recipe["id"]: recipe for recipe in recipes}
poem_ids = {poem["id"] for poem in poems}
assert len(recipes) == len(poems) == 441
assert recipe_ids == poem_ids
assert len(poem_ids) == len(poems)
assert len({poem["original"] for poem in poems}) == len(poems)

for poem in poems:
    assert poem["original"].strip()
    assert poem["translation"]["zhHans"].strip()
    assert poem["translation"]["zhHant"].strip()
    assert poem["translation"]["en"].strip()
    assert poem["basis"]["type"] in {"recipe-style", "documented-lore"}
    assert poem["basis"]["recipeSignals"]
    recipe = recipes_by_id[poem["id"]]
    ingredient_names = {ingredient["name"].casefold() for ingredient in recipe["ingredients"]}
    for signal in poem["basis"]["recipeSignals"]:
        kind, value = signal.split(":", 1)
        if kind == "ingredient":
            assert value.casefold() in ingredient_names, (poem["id"], signal)
        elif kind == "base":
            assert value == recipe["base"], (poem["id"], signal)
        elif kind == "method":
            assert value == recipe["method"], (poem["id"], signal)
        elif kind == "category":
            assert value == recipe["category"], (poem["id"], signal)
        else:
            raise AssertionError((poem["id"], signal))
    if not poem["language"].startswith("zh"):
        assert poem["original"] != poem["translation"]["zhHans"]

assert any(poem["language"] == "es" for poem in poems)
assert any(poem["language"] == "it" for poem in poems)
assert any(poem["language"] == "fr" for poem in poems)
assert any(poem["language"] == "pt" for poem in poems)

traditional = json.loads((ROOT / "data" / "zh-hant.json").read_text())
assert set(traditional["recipes"]) == recipe_ids
assert all(item["name"].strip() and item["instruction"].strip() for item in traditional["recipes"].values())

print(f"POETRY CHECK PASSED · {len(poems)} unique lines · {sum(not poem['language'].startswith('zh') for poem in poems)} foreign-language originals · Simplified/Traditional/English complete")
