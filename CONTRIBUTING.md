# Contributing to Size of Space

Thanks for helping make the universe a little easier to grasp! 🌌

## Getting started

```bash
npm install
npm run dev        # dev server with hot reload at http://localhost:5173
npm run typecheck  # TypeScript checks
npm run build      # production build into dist/
```

## Adding an object

1. Open [`src/data/objects.ts`](src/data/objects.ts).
2. Add an entry **in size order**: the list must go strictly from smallest to largest diameter.
3. Fill in:
   - `d`: diameter in metres (use the `KM`, `AU`, `LY` and `sunD()` helpers),
   - `kind`: which shader draws it (see the `Kind` type),
   - `cat`: the category shown in the info panel,
   - `look`: palette `c` and kind-specific parameters `p` / `q` (copy a similar object and tweak),
   - `name` and `fact` in **both English and Russian**,
   - `dist`: distance from Earth in metres, or `null`,
   - `wiki`: the slug of the English Wikipedia article.
4. Open `http://localhost:5173/#<your-id>` to look at it.

Please cite a reliable source for new sizes in your PR description.

## Improving visuals

Each `kind` has its own fragment shader in [`src/render/shaders.ts`](src/render/shaders.ts). Inside it, `vP` is the pixel's position in units of the object's radius (the edge is at `r = 1`), and `uPx` is the radius in device pixels, which is handy for anti-aliasing and level of detail.

## Translations

UI strings live in [`src/i18n.ts`](src/i18n.ts). To add a language, add a block there plus `name` / `fact` entries for every object.

## Pull requests

- Keep PRs focused: one feature or fix per PR.
- Run `npm run typecheck && npm run build` before submitting.
- Screenshots or short clips are very welcome for visual changes.
