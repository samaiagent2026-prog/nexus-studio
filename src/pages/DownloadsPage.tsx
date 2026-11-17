import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../lib/icons'
import { t } from '../lib/i18n'
import { dirFor } from '../lib/dir'
import { applyTheme } from '../lib/theme'
import { Badge, EmptyState, Segmented } from '../components/ui'
import { useStudio } from '../store/studio'

/* ============================================================
   Downloads page. Lists the static exports the build writes to
   `public/sites/` (see scripts/export-sites.mjs) so each one has a
   stable preview URL and a direct ZIP download URL.
   ============================================================ */

interface ExportedSite {
  slug: string
  name: string
  industry: string
  accent: string
  pages: number
  files: string[]
}

export function DownloadsPage() {
  const navigate = useNavigate()
  const { lang, setLang, sites } = useStudio()
  const [items, setItems] = React.useState<ExportedSite[] | null>(null)
  const [failed, setFailed] = React.useState(false)
  const themeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    applyTheme(themeRef.current, { ...sites[0]?.theme, mode: 'light', pageBg: '#f6f7f9' } as any)
  }, [sites])

  React.useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}sites/sites.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: ExportedSite[]) => alive && setItems(data))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])

  return (
    <div ref={themeRef} dir={dirFor(lang)} className="min-h-screen bg-[var(--surface-2)]" style={{ fontFamily: 'var(--font-sans)' }}>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-5 lg:px-8">
          <button type="button" className="btn-outline" onClick={() => navigate('/')}>
            <Ic n='ArrowLeft' size={15} />
            {t(lang, 'backToDashboard')}
          </button>
          <div className="ms-auto flex items-center gap-2">
            <Segmented
              value={lang}
              onChange={(v) => setLang(v as any)}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'ar', label: 'ع' },
              ]}
              size="sm"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 py-9 lg:px-8 lg:py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-950">{t(lang, 'downloadsTitle')}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-600">{t(lang, 'downloadsSubtitle')}</p>
        </div>

        {failed && (
          <EmptyState icon="FolderDown" title={t(lang, 'downloadsEmpty')} message={t(lang, 'downloadsEmpty')} />
        )}

        {items && items.length === 0 && !failed && (
          <EmptyState icon="FolderDown" title={t(lang, 'downloadsEmpty')} message={t(lang, 'downloadsEmpty')} />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {items?.map((site) => (
            <article
              key={site.slug}
              className="group overflow-hidden rounded-[22px] border border-[var(--border)] bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="h-1.5 w-full" style={{ background: site.accent }} />
              <div className="p-5">
                <div className="mb-3 flex items-start gap-3">
                  <span
                    className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl text-white shadow-soft"
                    style={{ background: site.accent }}
                  >
                    <Ic n='Globe' size={19} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-[16px] font-extrabold tracking-tight text-ink-950">{site.name}</h2>
                    <p className="truncate text-[13px] text-ink-500">{site.industry}</p>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="neutral" icon="FileText">
                    {site.pages} {t(lang, site.pages === 1 ? 'page' : 'pages')}
                  </Badge>
                  <Badge tone="neutral" icon="Files">
                    {site.files.length} {t(lang, 'filesLabel')}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className="btn-primary" href={`${import.meta.env.BASE_URL}sites/${site.slug}/`} target="_blank" rel="noreferrer">
                    <Ic n='ExternalLink' size={15} />
                    {t(lang, 'previewSite')}
                  </a>
                  <a className="btn-outline" href={`${import.meta.env.BASE_URL}sites/${site.slug}.zip`} download>
                    <Ic n='Download' size={15} />
                    {t(lang, 'downloadZip')}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
