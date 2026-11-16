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
- `src/components/builder/` — editor chrome: `Canvas`, `Inspector`,
  `FloatingToolbar`, `Library`, `Panels`, `DesignPanel`, `IconPicker`,
  `ImagePicker`
- `src/lib/store.ts` — the single source of truth (sites, undo/redo, toasts)

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
