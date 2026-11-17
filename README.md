# Nexus Studio — No-Code Visual Website Builder & Multi-Tenant CMS

A production-grade, block-based website builder: pick an industry template, edit every
element visually on the canvas, manage content through CMS collections, and hand the
client a dedicated `/admin` panel. Ships with full English + Arabic (LTR/RTL) support.

```bash
npm install
npm run dev      # http://localhost:12000 (also pre-builds the static exports)
```

`npm run build` compiles the app **and** regenerates the static site exports under
`public/sites/` (see below).

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · lucide-react · Zustand (persist + undo/redo) · React Router.

## What's inside

### Visual WYSIWYG editor (`/editor/:siteId`)
- **Click-to-edit canvas** — click any element to select it, double-click to type inline. Every element (heading, paragraph, button, image, badge, price, logo) is addressable and stylable.
- **Floating element toolbar** follows the selection with Edit text / Style / Settings plus section actions (move, duplicate, hide, lock, delete).
- **Declarative block schema** (`src/lib/schema.ts`) — each block declares its fields and elements once; the inspector, inline editing and defaults are all generated from it. No bespoke form code.
- **Inspector** with Content / Style / Advanced tabs, a settings search, and per-element controls (colour, size, weight, spacing, radius, shadow, alignment, opacity).
- **Layers panel** with drag-reorder, rename, hide/lock, duplicate and delete.
- **Design system panel** — 8 brand presets, editable brand ramp, body/display font stacks, radius scale, container width, light/dark surfaces.
- **Device preview** (desktop / tablet / mobile), live EN ⇄ AR switch, undo/redo (⌘Z / ⌘⇧Z), and full keyboard shortcuts.

### Block library (30 sections, 8 categories)
Hero & hero-with-search, rich text, image + text, stats, process, tabs, feature grid, gallery,
blog, image banner, comparison table, video, listing grid, booking widget, restaurant menu,
events, team, testimonials, logo cloud, social follow, CTA bands, pricing, FAQ, contact + map,
newsletter, spacer, locations map.

### CMS collections (`src/lib/collections.ts`)
Properties, products, services, team, testimonials, FAQ, posts, events, menu items, locations —
each with a typed field schema that drives both the admin editor and the block renderers.

### Client admin panel (`/admin`)
Isolated per-site login (credentials set in Settings), then a full dashboard: overview KPIs,
collection CRUD with search and a schema-driven record editor, page settings, media library with
drag-and-drop upload, appearance controls and site settings.

### Industry templates (`src/lib/templates.ts`)
Real estate, healthcare, e-commerce, restaurant, corporate — each a complete multi-page site
with copy, imagery and pre-populated collections.

### i18n & RTL (`src/lib/i18n.ts`, `src/lib/dir.ts`)
Localized text values throughout, mirrored layouts, logical CSS properties, and instant
direction switching for Arabic.

### Static exports & direct links
Every site can be exported to a self-contained static bundle (HTML + inlined CSS +
extracted assets + `nexus-site.json`) from the editor toolbar, the settings rail and the
dashboard cards. The build also pre-renders the demo sites to disk so they are linkable with
no client JavaScript:

| URL | What it is |
| --- | --- |
| `/sites/` | index of every generated site |
| `/sites/<slug>/` | preview that site (plain HTML) |
| `/sites/<slug>.zip` | download that site as a ZIP |
| `/sites/sites.json` | machine-readable manifest |
| `/downloads` | in-app page listing the same preview + download links |

Generate or refresh them with `npm run build:sites` (also runs automatically before
`npm run dev` and inside `npm run build`). The renderer is the *same* module the editor uses
(`src/lib/export/site.tsx`), bundled for Node with esbuild; only the stylesheet differs,
because it is compiled through PostCSS rather than Vite's `?inline` import.

## Project layout

```
src/
  lib/          domain: types, schema, collections, templates, theme, i18n, icons, utils
  store/        studio store (persisted state, history, actions) + demo seed
  components/
    ui/         design-system primitives (Button, Modal, Field, Slider, Toasts, …)
    blocks/     context (Element/Editable), kit, registry, BlockRenderer, defs/, render/
    builder/    Canvas, Inspector, Library, DesignPanel, Panels, IconPicker, ImagePicker
  pages/        Dashboard, Editor, Admin, PublicSite, Downloads
scripts/        export-sites.mjs — pre-renders demo sites to public/sites/
```

## Demo data

First run seeds four sites (Skyline Realty, Aurora Medical, Lumen Store, Sandbox) so the
dashboard and admin panel are immediately explorable. Client admin logins are shown on the
`/admin` sign-in screen — for example `admin@skyline.realty` / `skyline2026`.

State persists to `localStorage`; use **Settings → Export** to take a JSON snapshot, or
**Download site** to save the finished website as a runnable static bundle.
