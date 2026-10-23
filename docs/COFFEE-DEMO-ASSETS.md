# Nocturne Coffee demo assets

Public-demo experiment on `demo-2`; no PRD change. Three completed 16.4-second portrait motion ads use generated photographs, animated editorial copy, scene transitions, closing CTAs, and original synthesized ambient audio. This is a fictional coffee shop, and performance/funding figures remain illustrative.

| Film                              | Saved video                              | Saved background                      |
| --------------------------------- | ---------------------------------------- | ------------------------------------- |
| Your midnight ritual              | `public/videos/nocturne-midnight.webm`   | `public/images/coffee-midnight.png`   |
| A little obsession, in every shot | `public/videos/nocturne-espresso.webm`   | `public/images/coffee-espresso.png`   |
| A seat after dark                 | `public/videos/nocturne-afterhours.webm` | `public/images/coffee-afterhours.png` |

Rebuild the videos with `node scripts/generate-coffee-videos.mjs`. The copy/scene definitions live in `src/public-demo/coffee-ads.js`. The renderer uses local Chromium, Canvas and Web Audio, with VP9 video and Opus audio. Images were generated with the built-in imagegen tool, not the CLI/API fallback. The originals remain in Codex's generated-images folder; the application consumes the saved workspace copies above.

The public demo appends the coffee project, finished creatives and **Nocturne Studio · fictional** creator once to existing browser workspaces, retaining earlier records, uploads, edits and viewer giving history. The public palette uses midnight charcoal, plum, lilac, ivory and muted amber; the local backend keeps its existing theme.

## Final image prompts

### Midnight ritual

Use case: ads-marketing. Create a cinematic photorealistic background photograph for a fictional independent coffee shop ad. A beautiful dark ceramic espresso cup with crema on a black stone counter in a mysterious late-night coffee bar. Steam rises from cup. In background an elegant espresso machine, softly blurred warm amber lamps, deep plum shadows and midnight-blue interior, rain-streaked window catching a faint violet glow. Premium editorial coffee advertising, tactile details, shallow depth of field, restrained and atmospheric, plausible real cafe, portrait 2:3 composition with cup in center lower half and usable darker negative space in upper third for typography added later by code. Palette charcoal, aubergine, muted brass amber, ivory. No text, no logos, no watermark. This is a background for finished 16-second animated video ads and a website hero.

### Espresso craft

Use case: ads-marketing. Cinematic photorealistic portrait 2:3 background photograph for a fictional independent coffee shop video ad. Extreme close-up of espresso pouring in two beautiful golden streams from a professional espresso machine into a matte black ceramic cup on the grate, rich crema, a trace of steam, tactile metal reflections. Midnight and deep plum shadows, selective warm amber lighting, ivory highlights. Premium restrained atmospheric coffee advertising, shallow depth of field, beautiful real physical detail, no people, no text or logos or watermark. Keep room toward upper left for editorial typography added later. Visually distinct from a cafe wide shot; focus on craft and espresso.

### A seat after dark

Use case: ads-marketing. Cinematic photorealistic portrait 2:3 background photograph for a fictional neighborhood coffee shop video ad. Inviting small late-night coffee shop interior viewed through a rainy window, a cozy rounded booth with two cups of coffee on a little black stone table, amber pendant light and moody midnight blue/deep plum walls, shelves of coffee cups, faint violet reflections on rain droplets. No people. Premium editorial photography, intimate mysterious atmosphere, real plausible small cafe. Strong composition emphasizing booth and room, with subtle empty darker space for typography added later. No lettering, no signage, no logo, no watermark.
