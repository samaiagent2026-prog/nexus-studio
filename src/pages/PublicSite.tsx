import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resolveIcon, Ic } from '../lib/icons'
import { dirFor } from '../lib/dir'
import { applyTheme } from '../lib/theme'
import { tr } from '../lib/utils'
import { t } from '../lib/i18n'
import { BlockRenderer } from '../components/blocks/BlockRenderer'
import { useStudio } from '../store/studio'
import type { Lang, Site } from '../lib/types'
import { cn } from '../lib/utils'

/* ============================================================
   Public site renderer. Resolves a slug + path to a site and
   page, applies SEO metadata and renders in public mode.
   ============================================================ */

export function PublicSite({ siteId }: { siteId?: string }) {
  const { slug = '', '*': rest = '' } = useParams()
  const navigate = useNavigate()
  const sites = useStudio((s) => s.sites)
  const globalLang = useStudio((s) => s.lang)

  const site = React.useMemo(() => {
    if (siteId) return sites.find((s) => s.id === siteId) ?? null
    return sites.find((s) => s.slug === slug) ?? null
  }, [sites, slug, siteId])

  const path = '/' + rest.replace(/^\/+/, '')
  const page = React.useMemo(() => {
    if (!site) return null
    const target = path === '/' ? '/' : path.replace(/\/$/, '')
    return site.pages.find((p) => p.path === target) ?? site.pages.find((p) => p.path === '/') ?? site.pages[0] ?? null
  }, [site, path])

  const [lang, setLang] = React.useState<Lang>(site?.settings.defaultLang ?? globalLang)
  const themeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (site) setLang(site.settings.defaultLang)
  }, [site?.id, site?.settings.defaultLang])

  /* the header's language switch is rendered inside a block, so it talks to
     the page through a window event */
  React.useEffect(() => {
    const onSetLang = (e: Event) => setLang((e as CustomEvent).detail as Lang)
    window.addEventListener('nexus:set-lang', onSetLang)
    return () => window.removeEventListener('nexus:set-lang', onSetLang)
  }, [])

  React.useEffect(() => {
    if (site) applyTheme(themeRef.current, site.theme)
  }, [site?.theme, site])

  /* SEO */
  React.useEffect(() => {
    if (!site || !page) return
    const title = tr(page.seo?.title ?? site.settings.seo.title, lang) || site.name
    document.title = title
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.name = name
        document.head.appendChild(el)
      }
      el.content = content
    }
    setMeta('description', tr(page.seo?.description ?? site.settings.seo.description, lang))
    setMeta('keywords', site.settings.seo.keywords)
    document.documentElement.lang = lang
    document.documentElement.dir = dirFor(lang)
    if (site.settings.favicon) {
      let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = site.settings.favicon
    }
  }, [site, page, lang])

  if (!site || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50 p-6 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-600">
          <Ic n='SearchX' size={30} />
        </span>
        <h1 className="font-display text-2xl font-extrabold text-ink-950">{t(lang, 'siteNotFoundTitle')}</h1>
        <p className="max-w-md text-[14px] text-ink-500">
          {t(lang, 'noSiteRegistered')} <code className="font-mono text-ink-700">/{slug}</code>
        </p>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>
          {t(lang, 'backToStudio')}
        </button>
      </div>
    )
  }

  const go = (to: string) => {
    if (!to || to === '#') return
    if (/^https?:\/\//.test(to) || to.startsWith('mailto:') || to.startsWith('tel:')) {
      window.open(to, '_blank', 'noopener')
      return
    }
    navigate(`/site/${site.slug}${to === '/' ? '' : to}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      ref={themeRef}
      dir={dirFor(lang)}
      className="min-h-screen bg-white"
      style={{ background: site.theme.pageBg, fontFamily: 'var(--font-sans)' }}
    >
      {site.settings.announcementOn && site.settings.announcement && tr(site.settings.announcement, lang) && (
        <div className="bg-brand-600 px-4 py-2.5 text-center text-[13px] font-semibold text-white">
          {tr(site.settings.announcement, lang)}
        </div>
      )}

      <BlockRenderer
        site={site}
        block={site.header}
        lang={lang}
        mode="public"
        onNavigate={go}
      />

      <main>
        {page.blocks
          .filter((b) => !b.hidden)
          .map((block) => (
            <BlockRenderer key={block.id} site={site} block={block} lang={lang} mode="public" onNavigate={go} />
          ))}
      </main>

      <BlockRenderer site={site} block={site.footer} lang={lang} mode="public" onNavigate={go} />
    </div>
  )
}

/** Route helper: render a specific site in a new tab preview. */
export function useSiteUrl(site: Site | null, path = '/') {
  return React.useMemo(() => (site ? `/site/${site.slug}${path === '/' ? '' : path}` : '/'), [site, path])
}
