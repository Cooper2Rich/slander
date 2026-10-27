"""Prepare compact web assets from the supplied black-background brand logo."""

import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops


source_path = Path(sys.argv[1])
destination = Path(__file__).resolve().parent.parent / "public" / "brand"
destination.mkdir(parents=True, exist_ok=True)
if source_path.resolve() != (destination / "blue-ripple-logo.png").resolve():
    shutil.copyfile(source_path, destination / "blue-ripple-logo.png")
source = Image.open(source_path).convert("RGB")
mask = ImageChops.difference(source, Image.new("RGB", source.size)).convert("L")
rows = [y for y in range(source.height) if mask.crop((0, y, source.width, y + 1)).getbbox()]
gap_start, gap_end = max(zip(rows, rows[1:]), key=lambda pair: pair[1] - pair[0])
split = (gap_start + gap_end) // 2


def artwork(top, bottom):
    region = source.crop((0, top, source.width, bottom))
    return region.crop(region.getbbox())


mark = artwork(0, split)
for size, filename in [(512, "blue-ripple-mark.png"), (64, "blue-ripple-favicon.png")]:
    fitted = mark.copy()
    fitted.thumbnail((round(size * 0.94), round(size * 0.94)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size))
    canvas.paste(fitted, ((size - fitted.width) // 2, (size - fitted.height) // 2))
    canvas.save(destination / filename, optimize=True)

wordmark = artwork(split, source.height)
wordmark.resize((960, round(960 * wordmark.height / wordmark.width)), Image.Resampling.LANCZOS).save(
    destination / "blue-ripple-wordmark.png", optimize=True
)
