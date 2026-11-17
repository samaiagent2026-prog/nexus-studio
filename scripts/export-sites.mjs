import { build } from 'esbuild'
import postcss from 'postcss'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/* ============================================================
   Pre-renders the demo sites to static HTML so they can be linked
   directly — preview at /sites/<slug>/ and download at
   /sites/<slug>.zip — with no client JavaScript and no build step
   for the visitor. Runs on `npm run build` and on demand via
   `npm run build:sites`.

   The renderer is the exact module the editor uses, bundled for
   Node with esbuild; only the stylesheet differs, because Vite's
   `?inline` import has no meaning outside the bundler.
   ============================================================ */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outRoot = join(root, 'public', 'sites')

/** Swap Vite's `import css from '…?inline'` for an empty module. */
const cssInlineStub = {
  name: 'css-inline-stub',
  setup(b) {
    b.onResolve({ filter: /\.css\?inline$/ }, (args) => ({ path: args.path, namespace: 'css-inline-stub' }))
    b.onLoad({ filter: /.*/, namespace: 'css-inline-stub' }, () => ({ contents: 'export default ""', loader: 'js' }))
  },
}

async function loadRenderer() {
  const result = await build({
    stdin: {
      contents: [
        "export { buildDemoSites } from './src/lib/demo.ts'",
        "export { buildSiteFiles } from './src/lib/export/site.tsx'",
        "export { createZip } from './src/lib/zip.ts'",
      ].join('\n'),
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    // CommonJS, because React and lucide-react ship CJS builds that call
    // `require()` — which esbuild cannot keep when it emits ESM.
    format: 'cjs',
    platform: 'node',
    target: 'node18',
    jsx: 'automatic',
    plugins: [cssInlineStub],
    logLevel: 'warning',
  })
  const code = result.outputFiles[0].text
  const tmp = join(root, 'node_modules', '.cache', 'nexus-export.cjs')
  await mkdir(dirname(tmp), { recursive: true })
  await writeFile(tmp, code)
  return createRequire(import.meta.url)(tmp)
}

/** Compile src/styles.css with the project's real PostCSS pipeline. */
async function compileCss() {
  const source = await readFile(join(root, 'src', 'styles.css'), 'utf8')
  const result = await postcss([tailwind({ config: join(root, 'tailwind.config.js') }), autoprefixer]).process(source, {
    from: join(root, 'src', 'styles.css'),
  })
  return result.css
}

/** A short landing page listing every generated site. */
function indexHtml(sites) {
  const cards = sites
    .map(
      (s) => `      <li class="card">
        <div class="swatch" style="background:${s.accent}"></div>
        <div class="meta">
          <h2>${s.name}</h2>
          <p>${s.industry} · ${s.pages} page${s.pages === 1 ? '' : 's'}</p>
        </div>
        <div class="actions">
          <a class="btn primary" href="./${s.slug}/">معاينة · Preview</a>
          <a class="btn" href="./${s.slug}.zip" download>تنزيل ZIP · Download</a>
        </div>
      </li>`,
    )
    .join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Nexus Studio — generated sites</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 48px 24px 72px; background: #f6f7fb; color: #0e1017;
    font: 16px/1.5 Inter, system-ui, -apple-system, "Segoe UI", sans-serif; }
  header { max-width: 880px; margin: 0 auto 32px; }
  h1 { margin: 0 0 6px; font-size: 30px; letter-spacing: -.02em; }
  header p { margin: 0; color: #5b6479; }
  ul { list-style: none; max-width: 880px; margin: 0 auto; padding: 0; display: grid; gap: 12px; }
  .card { display: flex; align-items: center; gap: 16px; padding: 16px 18px; background: #fff;
    border: 1px solid rgba(15,23,42,.08); border-radius: 16px; box-shadow: 0 1px 2px rgba(16,24,40,.04); }
  .swatch { width: 44px; height: 44px; border-radius: 12px; flex: none; }
  .meta { flex: 1; min-width: 0; }
  .meta h2 { margin: 0 0 2px; font-size: 16px; }
  .meta p { margin: 0; color: #5b6479; font-size: 13.5px; }
  .actions { display: flex; gap: 8px; flex: none; }
  .btn { display: inline-flex; align-items: center; padding: 9px 14px; border-radius: 10px; font-size: 13.5px;
    font-weight: 600; text-decoration: none; color: #0e1017; background: #eef1f6; transition: .15s; }
  .btn:hover { background: #e2e7f0; }
  .btn.primary { color: #fff; background: #3b5ef6; }
  .btn.primary:hover { background: #2540e6; }
  @media (max-width: 620px) { .card { flex-wrap: wrap; } .actions { width: 100%; } .actions .btn { flex: 1; justify-content: center; } }
</style>
</head>
<body>
<header>
  <h1>Nexus Studio — generated sites</h1>
  <p>Static HTML exports. Preview in the browser or download the ZIP bundle.</p>
</header>
<ul>
${cards}
</ul>
</body>
</html>
`
}

async function main() {
  const { buildDemoSites, buildSiteFiles, createZip } = await loadRenderer()
  const css = await compileCss()
  const sites = buildDemoSites()

  await rm(outRoot, { recursive: true, force: true })

  const manifest = []
  for (const site of sites) {
    const { entries } = buildSiteFiles(site, 'en', css)
    const dir = join(outRoot, site.slug)
    await mkdir(dir, { recursive: true })
    for (const entry of entries) {
      const target = join(dir, entry.path)
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, entry.bytes ?? entry.text ?? '')
    }
    const zip = createZip(entries)
    await writeFile(join(outRoot, `${site.slug}.zip`), Buffer.from(await zip.arrayBuffer()))
    manifest.push({
      slug: site.slug,
      name: site.name,
      industry: site.industry,
      accent: site.theme?.brand?.['500'] ?? '#3b5ef6',
      pages: site.pages.length,
      files: entries.map((e) => e.path),
    })
    console.log(`  ${site.slug}: ${site.pages.length} page(s), ${entries.length} file(s)`)
  }

  await writeFile(join(outRoot, 'index.html'), indexHtml(manifest))
  await writeFile(join(outRoot, 'sites.json'), JSON.stringify(manifest, null, 2))
  console.log(`Exported ${manifest.length} sites to public/sites/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
