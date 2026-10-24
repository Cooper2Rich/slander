# Blue Ripple Media

The public demo uses the logo supplied by Cooper. Its original pixels are preserved in `public/brand/blue-ripple-logo.png`. Compact header and sidebar lockups use its monogram and lettering as separate crops; the footer and favicon use the monogram. No logo artwork was redrawn or generated.

The brand colors sampled from the source are blue `#2b9bff`, light blue `#5cc2ff`, mid blue `#1a82e2`, deep blue `#1466c4`, black and white. Shared public-demo theme variables apply these colors to buttons, links, navigation, focus outlines and leaderboard highlights across Public, Creator, Campaign Owner and Admin views. Semantic warning/error colors stay distinct.

Regenerate the web assets with Pillow installed:

```sh
python scripts/prepare-brand.py public/brand/blue-ripple-logo.png
```

The full original remains available alongside optimized small assets so page headers do not need to download the 4000-pixel source.
