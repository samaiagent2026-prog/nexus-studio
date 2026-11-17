# Nexus Studio — agent notes

Block-based, no-code website/page builder + multi-tenant CMS. React + Vite 5 +
TypeScript + Tailwind. No backend: all state lives in the browser and is
persisted to `localStorage`.

## Commands

- `npm run dev` — dev server (expected on port **12000**; see `vite.config.ts`)
- `npm run build` — `tsc` type-check + Vite production build into `dist/`
- `npx tsc --noEmit` — type-check only (run before committing)

## Architecture

- `src/lib/types.ts` — core domain types (`Site`, `Page`, `Block`, `Lang`, …)
- `src/lib/schema.ts` — declarative block schema: `FieldSchema`, `BlockDefinition`
- `src/components/blocks/defs/*.ts` — block definitions (English-authored
  labels/groups/options) consumed by the registry
- `src/components/blocks/registry.ts` — block lookup (`getBlockDef`)
- `src/components/builder/` — editor chrome: `Canvas`, `CanvasMenu`,
  `Inspector`, `FloatingToolbar`, `Library`, `Panels`, `DesignPanel`,
  `IconPicker`, `ImagePicker`
- `src/lib/store.ts` — the single source of truth (sites, undo/redo, toasts)

## Canvas interactions (edit mode)

Everything on the canvas is moved and deleted from the canvas itself:

- **Move** — sections have a grip chip; props-backed repeatable items
  (`EditableItem` with a `field`) have a grip handle. Both use HTML5 drag and
  drop; the drop target lives on the canvas (`BLOCK_MIME` / `ITEM_MIME`).
- **Delete / more** — right-click any section, element or item opens
  `CanvasMenu`. `Editable` / `EditableItem` / `KitButton` emit a `MenuTarget`
  through the `CanvasBridge` context (`useCanvasBridge().requestMenu`); the
  canvas owns the action list, so block renderers stay free of store imports.
- **Owner actions** — right-clicking an element nested in a repeatable item
  also exposes that item's move/duplicate/delete, discovered by walking up to
  the nearest `[data-item-field]` ancestor.
- All of it is disabled in preview mode; `CanvasBridge` is `null` there.

## Internationalisation (EN + AR with RTL)

Three cooperating layers — keep all three in sync when adding UI:

1. `src/lib/i18n.ts` — `t(lang, key)` dictionary. `en` and `ar` tables **must
   stay key-for-key identical** (same keys, no duplicates). `Lang` is `'en' | 'ar'`.
2. `src/lib/schemaCopy.ts` — `schemaCopy(text, lang)` translates inspector field
   labels, group headings, select-option labels and help text. The schema itself
   is authored in English; this table maps it to Arabic at render time. Every
   `label`/`group`/option `label`/`help` string in `blocks/defs/*` must have an
   entry here.
3. `src/lib/blockCopy.ts` — `blockLabel` / `blockDescription` / `displayBlockLabel`
   for the 32 block types.

RTL is driven by `dir` on the document, set from the active language. Layout
uses logical properties (`text-start`, `ms-*`, `end-*`) so it mirrors correctly.

### Gotchas

- `t()` is typed against the `en` keys, so a missing/typo'd key is a compile
  error — that is the intended guard.
- Watch for **duplicate keys** when appending to `i18n.ts`; `tsc` flags them
  (TS1117) and the later definition silently wins.
- Prefer adding a key over hard-coding a string in JSX. Search for
  `aria-label="`, `placeholder="` and `title="` before shipping.

## Conventions

- Components take `lang: Lang` and call `t(lang, …)`; block renderers read it
  from `useBlockCtx()` (`ctx.lang`).
- Icons come from the Lucide registry (`resolveIcon` / `Ic`), never direct imports.

## Direct manipulation (click-anything-to-edit)

`useDirectManipulation` in `src/components/blocks/context.tsx` is the single
implementation of canvas drag-to-move and corner-grip resize. `Editable`,
`EditableItem`, `KitButton`, `IconBadge` and `ImageBox` all opt in by passing a
`k` (element key); the hook is a no-op outside edit mode.

- Offsets are stored as `elementStyle.offsetX/offsetY` (px, relative
  positioning) and `scale`; both are reset by the inspector's "reset position".
- Drag is clamped to the canvas frame via `measureBounds`, which also subtracts
  any `position: absolute` overlay panels. That is what keeps a resize grip from
  sliding under the side panel at narrow widths.
- The resize grip sits *inside* the element (`bottom-0.5 end-0.5`). Ancestors use
  `overflow-hidden`, so an outward-offset handle gets clipped and becomes
  unclickable.
- `onPointerDown` calls `stopPropagation()` so nested draggables (an image
  inside a card) do not move both the child and the ancestor.
- Absolutely-positioned `ImageBox`es (hero backgrounds) are selectable but not
  draggable, because `left/top` would fight their own placement.

`src/lib/capabilities.ts` maps a clicked element key to the block props that
belong to it, powering the "see everything about this element" panel. When
adding a new element key that does not mirror its prop path, add a rule to
`KEY_ALIASES` or extend `pathMatches`.

### Gotchas

- Selection is **ephemeral UI state** — it is not written to localStorage. Test
  it through the DOM (`.outline-brand-500` on `[data-el]`) or the panel header.
- `data-el` must be gated on `ctx.mode === 'edit'`; otherwise the attribute
  leaks into the published site.
- Offline sandboxes cannot reach `picsum.photos` / Google Fonts, so console
  "Failed to load resource" noise is expected. Assert real failures on
  `page.on('response')` for same-origin URLs instead.

## Static site export ("Download site")

`src/lib/export/` turns a `Site` into a self-contained bundle the user can save
to their device — this is the answer to "the designed site cannot be
downloaded".

- `site.tsx` — `downloadSiteBundle(site, lang)` renders each page with
  `renderToStaticMarkup` (mode `'export'`), inlines the compiled Tailwind CSS
  plus theme tokens, rewrites `<a href>` between pages to sibling `.html`
  files, and zips everything.
- `runtime.ts` — a small vanilla script embedded in every page. It re-binds the
  behaviour React used to own: EN/AR switching (with `dir`/`lang` on `<html>`),
  the mobile menu, accordions, tabs and the gallery lightbox.
- `../zip.ts` — dependency-free ZIP writer (CRC32 + stored deflate-free entries).

### Adding an interactive block

Interactive renderers must expose **export hooks** so the runtime can drive
them without React:

- gate every hook on `ctx.mode === 'edit' ? undefined : …` so nothing leaks into
  the canvas;
- hide/show with the `hidden` **class**, never the `hidden` attribute — Tailwind
  display utilities (`.grid`, `.flex`) override the attribute;
- scope DOM lookups to a `data-nexus-*-root` wrapper, since panels are siblings
  of the control that toggles them, not descendants.

Hooks in use: `data-nexus-lang`, `data-nexus-menu(-toggle)`,
`data-nexus-accordion(-item/-trigger/-panel)`, `data-nexus-tab`,
`data-nexus-tab-panel` (inside `data-nexus-tabs-root`), `data-nexus-lightbox-src`,
and `data-nexus-i18n` + `data-en`/`data-ar` on any `Editable` (emitted
automatically) for runtime copy swapping.

### Gotchas

- Never run `npx prettier` here: there is no repo config, so the default profile
  reflows the whole file and destroys the hand-tuned long-line style.
- Inline `data:` images are extracted to `assets/asset-N.ext` and de-duplicated;
  percent-encoded SVG (icons, the CSS noise texture) is intentionally left
  inline inside the stylesheet.
- Links to pages that were never created fall back to `index.html` instead of
  shipping a broken `href`.

## Generated static exports (`public/sites/`)

`scripts/export-sites.mjs` pre-renders the demo sites to plain files so they have
stable, linkable URLs: preview at `/sites/<slug>/`, download at `/sites/<slug>.zip`,
plus `/sites/sites.json` and an index at `/sites/`. The app surfaces the same list at
`/downloads`. These paths are git-ignored and rebuilt by `predev` / `npm run build`.

How it works, and why:

- The renderer is the *same* module the editor uses — `buildSiteFiles` from
  `src/lib/export/site.tsx` — bundled for Node with esbuild (`format: 'cjs'`, because
  React and lucide-react ship CJS that call `require()`). A plugin stubs
  `?inline` CSS imports, which only Vite understands.
- The stylesheet is compiled here with PostCSS + Tailwind and passed in as
  `buildSiteFiles(site, lang, css)`; the browser path leaves it undefined and uses
  Vite's `?inline` text. One renderer, two stylesheet sources.
- `themeVars` (in `src/lib/theme.ts`) is the DOM-free token map behind both
  `applyTheme` (live editor) and the exporter's `:root` block. Keep it DOM-free so
  the build can call it under Node.
- Demo sites come from `src/lib/demo.ts` (`buildDemoSites`), not `src/store/seed.ts`,
  so the build never pulls in Zustand or `localStorage`.

### Gotchas

- `public/sites/` is generated; never hand-edit it. Run `npm run build:sites`.
- The `/sites/<slug>/` pretty URL is served by the `staticDirIndex` middleware in
  `vite.config.ts` (dev + preview): a trailing-slash path is otherwise treated as a
  client route and returns the SPA shell instead of the folder's `index.html`.
- The Node render is deliberately DOM-free. `renderToStaticMarkup` runs every
  component's render pass but no effects, so `window`/`document` access must stay
  inside `useEffect`/event handlers.
