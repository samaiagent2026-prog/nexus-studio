import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import cssText from '../../styles.css?inline'
import { BlockRenderer } from '../../components/blocks/BlockRenderer'
import { themeVars } from '../theme'
import { dirFor } from '../dir'
import { tr } from '../utils'
import type { Block, Lang, Site } from '../types'
import { createZip, triggerDownload, type ZipEntry } from '../zip'
import { EXPORT_RUNTIME } from './runtime'

/* ============================================================
   Static site exporter.

   Renders the published site to plain HTML with the React server
   renderer, inlines the compiled stylesheet and the theme tokens,
   pulls every inline asset out into an assets/ folder, then hands
   the browser a ZIP. The result opens from the file system with no
   server and no build step.
   ============================================================ */

const MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
  'image/x-icon': 'ico',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
}

interface AssetSink {
  entries: ZipEntry[]
  /** Map of original data URL → relative path in the bundle. */
  seen: Map<string, string>
  counter: { n: number }
}

/** Turn `data:<mime>;base64,<payload>` into bytes plus an extension. */
function decodeDataUrl(url: string): { bytes: Uint8Array; ext: string } | null {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(url)
  if (!match) return null
  const [, mime, base64, payload] = match
  const ext = MIME_EXT[mime] ?? mime.split('/')[1] ?? 'bin'
  if (!base64) {
    const text = decodeURIComponent(payload)
    return { bytes: new TextEncoder().encode(text), ext }
  }
  try {
    const binary = atob(payload)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return { bytes, ext }
  } catch {
    return null
  }
}

/** Move every inline asset referenced by the markup into the bundle. */
function extractAssets(html: string, sink: AssetSink): string {
  // Base64 payloads are matched greedily; percent-encoded SVG keeps its own
  // (wider) character set so icons are pulled out too.
  return html.replace(/data:(?:image|video)\/[a-zA-Z0-9.+-]+(?:;base64)?,[^"'\s]+/g, (dataUrl) => {
    const cached = sink.seen.get(dataUrl)
    if (cached) return cached
    const decoded = decodeDataUrl(dataUrl)
    if (!decoded) return dataUrl
    const name = `assets/asset-${++sink.counter.n}.${decoded.ext}`
    sink.entries.push({ path: name, bytes: decoded.bytes })
    sink.seen.set(dataUrl, name)
    return name
  })
}

/** `#3b5ef6` → `59 94 246` for Tailwind's alpha channels. */
function channels(hex: string): string {
  const clean = (hex || '').replace('#', '').trim()
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6)
  const int = parseInt(full || '000000', 16)
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

/** Theme tokens as CSS text, built from the shared DOM-free `themeVars`. */
function themeCss(site: Site): string {
  const decls = Object.entries(themeVars(site.theme)).map(([prop, value]) => `  ${prop}: ${value};`)
  return `:root {\n${decls.join('\n')}\n}`
}

/** `#rgba`-safe inline styles for the page shell. */
function pageVars(site: Site) {
  return {
    background: site.theme.pageBg,
    fontFamily: 'var(--font-sans)',
  } as React.CSSProperties
}

function renderPageBody(site: Site, blocks: Block[], lang: Lang): string {
  const announcement = site.settings.announcementOn && site.settings.announcement && tr(site.settings.announcement, lang)
  return renderToStaticMarkup(
    React.createElement(
      'div',
      { className: 'nexus-site', dir: dirFor(lang), style: pageVars(site) },
      announcement
        ? React.createElement('div', { className: 'bg-brand-600 px-4 py-2.5 text-center text-[13px] font-semibold text-white' }, announcement)
        : null,
      React.createElement(BlockRenderer, { site, block: site.header, lang, mode: 'public' }),
      React.createElement(
        'main',
        null,
        blocks.filter((b) => !b.hidden).map((block) => React.createElement(BlockRenderer, { key: block.id, site, block, lang, mode: 'public' })),
      ),
      React.createElement(BlockRenderer, { site, block: site.footer, lang, mode: 'public' }),
    ),
  )
}

/** Export file name for a page path. */
function fileNameFor(path: string): string {
  const clean = (path || '/').replace(/^\/+|\/+$/g, '')
  return clean ? `${clean.replace(/\//g, '-')}.html` : 'index.html'
}

/** Rewrite in-site links so they resolve between the exported files. */
function rewriteLinks(html: string, site: Site): string {
  const map = new Map<string, string>()
  for (const page of site.pages) {
    map.set(page.path, fileNameFor(page.path))
    map.set(page.path.replace(/\/$/, '') || '/', fileNameFor(page.path))
  }
  return html.replace(/href="([^"]*)"/g, (full, href: string) => {
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return full
    if (/^[a-z]+:\/\//i.test(href) || href.startsWith('data:') || href.startsWith('assets/')) return full
    const [pathPart, hash = ''] = href.split('#')
    const key = pathPart.replace(/\/$/, '') || '/'
    // A link to a page that was never created would 404 on the exported host,
    // so send it home instead of leaving it broken.
    const target = map.get(key) ?? map.get('/')
    if (!target) return full
    return `href="${target}${hash ? `#${hash}` : ''}"`
  })
}

function pageDocument(site: Site, title: string, description: string, body: string, css: string, fonts: string, lang: Lang): string {
  const favicon = site.settings.favicon && !site.settings.favicon.startsWith('data:') ? site.settings.favicon : ''
  return `<!doctype html>
<html lang="${lang}" dir="${dirFor(lang)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
${site.settings.seo.keywords ? `<meta name="keywords" content="${escapeHtml(site.settings.seo.keywords)}" />` : ''}
${favicon ? `<link rel="icon" href="${favicon}" />` : ''}
${fonts}
<style>
${css}
</style>
</head>
<body>
${body}
${LIGHTBOX}
<script>${EXPORT_RUNTIME}</script>
</body>
</html>
`
}

const LIGHTBOX = `<div data-nexus-lightbox class="hidden fixed inset-0 z-[999] flex items-center justify-center bg-ink-950/85 p-6 backdrop-blur-sm">
<button type="button" data-nexus-lightbox-close aria-label="Close" class="absolute end-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">✕</button>
<img alt="" class="max-h-full max-w-full rounded-2xl object-contain shadow-lift" />
</div>`

function escapeHtml(value: string): string {
  return (value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}

function fontLinks(): string {
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />`
}

export interface ExportResult {
  files: { path: string; size: number }[]
  totalSize: number
}

export interface BuildResult {
  entries: ZipEntry[]
  result: ExportResult
}

const sizeOf = (entry: ZipEntry): number =>
  entry.text ? new TextEncoder().encode(entry.text).length : (entry.bytes?.length ?? 0)

/**
 * Render the site to its individual bundle files — no Blob, no browser — so
 * the exact same code runs under Node during the build and in the browser when
 * the user clicks "Download site". `cssOverride` lets the Node build supply the
 * PostCSS-compiled stylesheet in place of Vite's `?inline` text.
 */
export function buildSiteFiles(site: Site, lang: Lang, cssOverride?: string): BuildResult {
  const entries: ZipEntry[] = []
  const sink: AssetSink = { entries, seen: new Map(), counter: { n: 0 } }
  const css = cssOverride ?? `${themeCss(site)}\n${cssText}`
  const fonts = fontLinks()

  for (const page of site.pages) {
    let body = renderPageBody(site, page.blocks, lang)
    body = extractAssets(body, sink)
    body = rewriteLinks(body, site)
    const title = tr(page.seo?.title ?? site.settings.seo.title, lang) || site.name
    const description = tr(page.seo?.description ?? site.settings.seo.description, lang)
    const html = pageDocument(site, title, description, body, css, fonts, lang)
    entries.push({ path: fileNameFor(page.path), text: html })
  }

  // The portable JSON travels with the bundle so the site can be re-imported.
  entries.push({ path: 'nexus-site.json', text: JSON.stringify(site, null, 2) })

  const result: ExportResult = {
    files: entries.map((e) => ({ path: e.path, size: sizeOf(e) })),
    totalSize: entries.reduce((n, e) => n + sizeOf(e), 0),
  }
  return { entries, result }
}

/** Build the ZIP in memory and return it plus a manifest. */
export function buildSiteBundle(site: Site, lang: Lang): { blob: Blob; result: ExportResult } {
  const { entries, result } = buildSiteFiles(site, lang)
  const blob = createZip(entries)
  return { blob, result: { ...result, totalSize: blob.size } }
}

/** Build the bundle and hand it to the browser as a download. */
export function downloadSiteBundle(site: Site, lang: Lang): ExportResult {
  const { blob, result } = buildSiteBundle(site, lang)
  triggerDownload(blob, `${site.slug || 'site'}.zip`)
  return result
}
