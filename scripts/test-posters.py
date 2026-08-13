#!/usr/bin/env python3
import json
import sys
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
recipes = json.loads((root / "data/recipes.json").read_text())["recipes"]
manifest = json.loads((root / "data/visual-manifest.json").read_text())
visuals = manifest["visuals"]
poster_root = root / "assets/posters"

errors = []
recipe_ids = {item["id"] for item in recipes}
visual_ids = {item["id"] for item in visuals}
file_ids = {path.stem for path in poster_root.glob("*.jpg")}

if len(recipes) != 441:
    errors.append(f"expected 441 recipes, found {len(recipes)}")
if len(visuals) != len(recipes):
    errors.append(f"visual count {len(visuals)} != recipe count {len(recipes)}")
if recipe_ids != visual_ids:
    errors.append(f"manifest id mismatch: missing={sorted(recipe_ids - visual_ids)} extra={sorted(visual_ids - recipe_ids)}")
if recipe_ids != file_ids:
    errors.append(f"poster file mismatch: missing={sorted(recipe_ids - file_ids)} extra={sorted(file_ids - recipe_ids)}")

for record in visuals:
    path = root / record["assetPath"]
    if record["generation"]["status"] != "generated":
        errors.append(f'{record["id"]}: status={record["generation"]["status"]}')
    if record["generation"]["qa"] != "pass":
        errors.append(f'{record["id"]}: qa={record["generation"]["qa"]}')
    if not record["source"]["imageUrl"]:
        errors.append(f'{record["id"]}: missing source image URL')
    if not record["prompt"].strip():
        errors.append(f'{record["id"]}: missing generation prompt')
    if not path.is_file() or path.stat().st_size < 20_000:
        errors.append(f'{record["id"]}: missing or suspiciously small poster')
        continue
    with Image.open(path) as image:
        width, height = image.size
        if height <= width or not 1.55 <= height / width <= 1.75:
            errors.append(f'{record["id"]}: unexpected dimensions {width}x{height}')

app_js = (root / "app.js").read_text()
order_js = (root / "order.js").read_text()
for filename, source in (("app.js", app_js), ("order.js", order_js)):
    if 'assets/posters/${recipe.id}.jpg' not in source:
        errors.append(f"{filename}: poster path is not wired to recipe id")
    if "posterAlt" not in source:
        errors.append(f"{filename}: localized poster alt text is missing")

if manifest["meta"].get("qaPassCount") != len(visuals):
    errors.append(f'meta qaPassCount={manifest["meta"].get("qaPassCount")} expected {len(visuals)}')

if errors:
    print("POSTER CHECK FAILED")
    print("\n".join(f"- {error}" for error in errors[:80]))
    sys.exit(1)

total_bytes = sum((root / item["assetPath"]).stat().st_size for item in visuals)
print(f"POSTER CHECK PASSED · {len(visuals)} images · {total_bytes / 1024 / 1024:.1f} MiB · all QA pass")
