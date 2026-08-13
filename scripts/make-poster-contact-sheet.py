#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


parser = argparse.ArgumentParser(description="Build a labelled QA contact sheet for generated cocktail posters.")
parser.add_argument("--ids", required=True, help="Comma-separated drink ids")
parser.add_argument("--output", required=True, help="Output JPEG path")
args = parser.parse_args()

atlas_root = Path(__file__).resolve().parent.parent
manifest = json.loads((atlas_root / "data/visual-manifest.json").read_text())
by_id = {item["id"]: item for item in manifest["visuals"]}
ids = [item.strip() for item in args.ids.split(",") if item.strip()]
records = [by_id[item] for item in ids]

columns = 4
thumb_width, thumb_height = 240, 400
label_height, gap = 88, 18
margin = 24
rows = (len(records) + columns - 1) // columns
sheet_width = margin * 2 + columns * thumb_width + (columns - 1) * gap
sheet_height = margin * 2 + rows * (thumb_height + label_height) + (rows - 1) * gap
sheet = Image.new("RGB", (sheet_width, sheet_height), "#e9dfce")
draw = ImageDraw.Draw(sheet)
font = ImageFont.load_default(size=15)
small = ImageFont.load_default(size=12)

for index, record in enumerate(records):
    row, column = divmod(index, columns)
    x = margin + column * (thumb_width + gap)
    y = margin + row * (thumb_height + label_height + gap)
    path = atlas_root / record["assetPath"]
    poster = Image.open(path).convert("RGB")
    poster.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
    tile = Image.new("RGB", (thumb_width, thumb_height), "#f5efe4")
    tile.paste(poster, ((thumb_width - poster.width) // 2, (thumb_height - poster.height) // 2))
    sheet.paste(tile, (x, y))
    draw.rectangle((x, y, x + thumb_width - 1, y + thumb_height - 1), outline="#74695f", width=1)
    label_y = y + thumb_height + 8
    name = record["name"][:31]
    draw.text((x, label_y), f'{record["id"]}  {name}', fill="#17110e", font=font)
    expected = f'{record["evidence"]["glass"]} · {record["evidence"]["method"]}'[:42]
    draw.text((x, label_y + 24), expected, fill="#5f554c", font=small)
    draw.text((x, label_y + 44), record["evidence"]["liquid"][:42], fill="#5f554c", font=small)

output = Path(args.output).resolve()
output.parent.mkdir(parents=True, exist_ok=True)
sheet.save(output, "JPEG", quality=88, optimize=True)
print(output)
