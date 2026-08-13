#!/usr/bin/env python3
import json
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
recipes = json.loads((ROOT / "data" / "recipes.json").read_text())["recipes"]
payload = json.loads((ROOT / "data" / "order-quotes.json").read_text())
quotes = payload["quotes"]
assignments = payload["assignments"]

recipe_ids = {recipe["id"] for recipe in recipes}
recipes_by_id = {recipe["id"]: recipe for recipe in recipes}
quote_ids = {quote["id"] for quote in quotes}
assignment_ids = {assignment["id"] for assignment in assignments}

assert len(recipes) == len(assignments) == 441
assert recipe_ids == assignment_ids
assert len(quote_ids) == len(quotes) == payload["meta"]["quoteCount"]
assert "No line is invented" in payload["meta"]["contentPolicy"]
assert "Chinese-origin drinks use Chinese verse" in payload["meta"]["assignmentPolicy"]

for quote in quotes:
    assert quote["original"].strip()
    assert quote["language"] in {"zh-Hant", "en", "fr", "es", "it", "pt"}
    assert quote["profiles"]
    assert all(quote["translation"][key].strip() for key in ("zhHans", "zhHant", "en"))
    attribution = quote["attribution"]
    assert all(attribution["author"][key].strip() for key in ("zhHans", "zhHant", "en"))
    assert all(attribution["work"][key].strip() for key in ("zhHans", "zhHant", "en"))
    parsed = urlparse(attribution["sourceUrl"])
    assert parsed.scheme == "https" and parsed.netloc
    assert attribution["sourceLabel"].strip()
    assert "public domain" in attribution["publicDomainBasis"].casefold()
    assert attribution["verifiedOn"]
    if not quote["language"].startswith("zh"):
        assert quote["original"] != quote["translation"]["zhHans"]

for assignment in assignments:
    assert assignment["quoteId"] in quote_ids
    quote_item = next(item for item in quotes if item["id"] == assignment["quoteId"])
    basis = assignment["basis"]
    assert basis["type"] == "verified-public-domain-style-match"
    assert basis["profile"] in quote_item["profiles"]
    assert basis["originGroup"] in {"china", "international"}
    assert basis["originEvidence"]["source"].strip()
    assert basis["originEvidence"]["reason"].strip()
    if basis["originGroup"] == "china":
        assert quote_item["language"].startswith("zh"), (assignment["id"], quote_item["id"])
    else:
        assert not quote_item["language"].startswith("zh"), (assignment["id"], quote_item["id"])
    assert basis["recipeSignals"]
    assert all(basis["rationale"][key].strip() for key in ("zhHans", "zhHant", "en"))
    recipe = recipes_by_id[assignment["id"]]
    ingredient_names = {ingredient["name"].casefold() for ingredient in recipe["ingredients"]}
    for signal in basis["recipeSignals"]:
        kind, value = signal.split(":", 1)
        if kind == "ingredient":
            assert value.casefold() in ingredient_names, (assignment["id"], signal)
        elif kind == "base":
            assert value == recipe["base"], (assignment["id"], signal)
        elif kind == "method":
            assert value == recipe["method"], (assignment["id"], signal)
        elif kind == "category":
            assert value == recipe["category"], (assignment["id"], signal)
        else:
            raise AssertionError((assignment["id"], signal))

languages = Counter(quote["language"] for quote in quotes)
assert all(languages[language] for language in ("zh-Hant", "en", "fr", "es", "it", "pt"))
origin_counts = Counter(assignment["basis"]["originGroup"] for assignment in assignments)
assert origin_counts["china"] == payload["meta"]["originAudit"]["chinaRecipeCount"]
assert origin_counts["international"] == payload["meta"]["originAudit"]["internationalRecipeCount"]

traditional = json.loads((ROOT / "data" / "zh-hant.json").read_text())
assert set(traditional["recipes"]) == recipe_ids

print(f"QUOTE CHECK PASSED · {len(quotes)} verified public-domain excerpts · {origin_counts['china']} Chinese / {origin_counts['international']} international drink matches · {len(languages)} source languages")
