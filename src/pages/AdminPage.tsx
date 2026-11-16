import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resolveIcon, Ic } from '../lib/icons'
import { t } from '../lib/i18n'
import { dirFor } from '../lib/dir'
import { applyTheme } from '../lib/theme'
import { COLLECTIONS, COLLECTION_KEYS } from '../lib/collections'
import { clone, downloadJson, formatDate, tr } from '../lib/utils'
import { Badge, ConfirmDialog, Dropdown, EmptyState, Field, IconButton, MenuItem, Modal, Segmented, Select, TextArea, TextInput, Toggle, Tooltip } from '../components/ui'
import { ImagePicker, MediaGrid } from '../components/builder/ImagePicker'
import { useStudio } from '../store/studio'
import type { CollectionField, Lang, Site } from '../lib/types'
import { cn } from '../lib/utils'

/* ============================================================
   Client admin panel (/admin). Each site has isolated login
   credentials and only sees its own content.
   ============================================================ */

const SESSION_KEY = 'nexus-admin-session'

export function AdminPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const sites = useStudio((s) => s.sites)
  const lang = useStudio((s) => s.lang)
  const setLang = useStudio((s) => s.setLang)
  const [siteSlug, setSiteSlug] = React.useState(params.get('site') ?? sites[0]?.slug ?? '')
  const [session, setSession] = React.useState<{ siteId: string; email: string } | null>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const site = sites.find((s) => s.slug === siteSlug) ?? sites[0] ?? null
  const authed = session && site && session.siteId === site.id

  const signIn = (email: string, password: string) => {
    if (!site) return false
    if (email.trim().toLowerCase() === site.admin.email.toLowerCase() && password === site.admin.password) {
      const next = { siteId: site.id, email }
      setSession(next)
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
      return true
    }
    return false
  }

  const signOut = () => {
    setSession(null)
    sessionStorage.removeItem(SESSION_KEY)
  }

  if (sites.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-2)] p-6">
        <EmptyState
          icon="LayoutTemplate"
          title={t(lang, 'noSitesAvailable')}
          message={t(lang, 'adminEmptyHint')}
          action={
            <button type="button" className="btn-primary" onClick={() => navigate('/')}>
              <Ic n='Gem' size={15} />
              {t(lang, 'openStudio')}
            </button>
          }
        />
      </div>
    )
  }

  if (!site) return null

  if (!authed) {
    return <AdminLogin site={site} lang={lang} onSignIn={signIn} sites={sites} onPickSite={setSiteSlug} />
  }

  return <AdminShell site={site} lang={lang} setLang={setLang} onSignOut={signOut} onExit={() => navigate('/')} />
}

/* ---------------- login ---------------- */

function AdminLogin({
  site,
  lang,
  sites,
  onSignIn,
  onPickSite,
}: {
  site: Site
  lang: Lang
  sites: Site[]
  onSignIn: (email: string, password: string) => boolean
  onPickSite: (slug: string) => void
}) {
  const [email, setEmail] = React.useState(site.admin.email)
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [show, setShow] = React.useState(false)
  const themeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    applyTheme(themeRef.current, site.theme)
  }, [site.theme])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!onSignIn(email, password)) setError(t(lang, 'invalidCredentials'))
    else setError(null)
  }

  return (
    <div ref={themeRef} dir={dirFor(lang)} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 p-5" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="pointer-events-none absolute inset-0 mesh opacity-30" />
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-lift backdrop-blur-2xl lg:grid lg:grid-cols-2">
        {/* brand pane */}
        <div className="flex flex-col justify-between gap-8 p-8 lg:p-10">
          <div>
            <div className="flex items-center gap-3">
              {site.logo ? (
                <img src={site.logo} alt="" className="h-11 w-auto max-w-[150px] object-contain" />
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Ic n='Gem' size={21} />
                </span>
              )}
              <div>
                <p className="font-display text-lg font-extrabold text-white">{site.name}</p>
                <p className="text-[11.5px] text-white/50">{site.industry}</p>
              </div>
            </div>

            <h1 className="mt-9 font-display text-2xl font-extrabold leading-tight text-white lg:text-[1.9rem]">
              {t(lang, 'welcomeBack')}
            </h1>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/60">{t(lang, 'adminHelp')}</p>

            <ul className="mt-7 flex flex-col gap-3">
              {[
                { icon: 'FileText', text: t(lang, 'adminFeat1') },
                { icon: 'Database', text: t(lang, 'adminFeat2') },
                { icon: 'Image', text: t(lang, 'adminFeat3') },
                { icon: 'Palette', text: t(lang, 'adminFeat4') },
              ].map((f) => {
                const Icon = resolveIcon(f.icon)
                return (
                  <li key={f.text} className="flex items-center gap-3 text-[13.5px] text-white/70">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-brand-300">
                      <Icon size={15} />
                    </span>
                    {f.text}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/40">
              <Ic n='KeyRound' size={12} />
              {t(lang, 'demoCreds')}
            </p>
            <p className="font-mono text-[12px] text-white/70">{site.admin.email}</p>
            <p className="font-mono text-[12px] text-white/70">{site.admin.password}</p>
            <button
              type="button"
              onClick={() => {
                setEmail(site.admin.email)
                setPassword(site.admin.password)
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-300 hover:text-brand-200"
            >
              <Ic n='Wand2' size={13} />
              {t(lang, 'useDemo')}
            </button>
          </div>
        </div>

        {/* form pane */}
        <div className="border-t border-white/10 bg-white p-8 lg:border-s lg:border-t-0 lg:p-10">
          <form onSubmit={submit} className="flex h-full flex-col justify-center gap-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge tone="brand" icon="ShieldCheck">{t(lang, 'secureArea')}</Badge>
              <Segmented
                value={lang}
                onChange={(v) => useStudio.getState().setLang(v as Lang)}
                options={[
                  { value: 'en', label: 'EN' },
                  { value: 'ar', label: 'ع' },
                ]}
                size="sm"
              />
            </div>

            {sites.length > 1 && (
              <Field label={t(lang, 'tenant')}>
                <Select value={site.slug} onChange={onPickSite} options={sites.map((s) => ({ value: s.slug, label: s.name }))} />
              </Field>
            )}

            <Field label={t(lang, 'email')}>
              <TextInput value={email} onChange={setEmail} icon="Mail" autoComplete="username" />
            </Field>

            <Field label={t(lang, 'password')}>
              <div className="relative">
                <TextInput value={password} onChange={setPassword} type={show ? 'text' : 'password'} autoComplete="current-password" />
                <button type="button" onClick={() => setShow((v) => !v)} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-500">
                  <Ic n={show ? 'EyeOff' : 'Eye'} size={15} />
                </button>
              </div>
            </Field>

            {error && (
              <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-700">
                <Ic n='AlertTriangle' size={15} />
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary mt-1 w-full py-3">
              <Ic n='LogIn' size={16} />
              {t(lang, 'signIn')}
            </button>

            <p className="text-center text-[11.5px] text-ink-400">{t(lang, 'passwordHint')}</p>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ---------------- admin shell ---------------- */

type AdminTab = 'overview' | 'content' | 'media' | 'pages' | 'brand' | 'settings'

function AdminShell({ site, lang, setLang, onSignOut, onExit }: { site: Site; lang: Lang; setLang: (l: Lang) => void; onSignOut: () => void; onExit: () => void }) {
  const [tab, setTab] = React.useState<AdminTab>('overview')
  const themeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    applyTheme(themeRef.current, site.theme)
  }, [site.theme])

  const totalRecords = Object.values(site.collections).reduce((n, list) => n + list.length, 0)
  const totalBlocks = site.pages.reduce((n, p) => n + p.blocks.length, 0)

  const nav: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'overview', icon: 'LayoutDashboard', label: t(lang, 'overview') },
    { id: 'content', icon: 'Database', label: t(lang, 'collections') },
    { id: 'pages', icon: 'Files', label: t(lang, 'pages') },
    { id: 'media', icon: 'Image', label: t(lang, 'media') },
    { id: 'brand', icon: 'Palette', label: t(lang, 'appearance') },
    { id: 'settings', icon: 'Settings', label: t(lang, 'settings') },
  ]

  return (
    <div ref={themeRef} dir={dirFor(lang)} className="flex min-h-screen bg-[var(--surface-2)]" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-e border-[var(--border)] bg-white lg:flex">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] p-4">
          {site.logo ? (
            <img src={site.logo} alt="" className="h-9 w-auto max-w-[120px] object-contain" />
          ) : (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Ic n='Gem' size={17} />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-extrabold text-ink-950">{site.name}</p>
            <p className="truncate text-[10.5px] text-ink-400">{t(lang, 'adminPanel')}</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const Icon = resolveIcon(item.icon)
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-start text-[13px] font-bold transition',
                  active ? 'bg-brand-600 text-white shadow-soft' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                <Icon size={17} />
                {item.label}
                {item.id === 'content' && <span className={cn('ms-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-white/20' : 'bg-ink-200 text-ink-600')}>{totalRecords}</span>}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <button type="button" className="btn-outline w-full" onClick={onExit}>
            <Ic n='Gem' size={15} />
            {t(lang, 'backToStudio')}
          </button>
          <button type="button" className="btn-ghost mt-1.5 w-full text-rose-600 hover:bg-rose-50" onClick={onSignOut}>
            <Ic n='LogOut' size={15} />
            {t(lang, 'signOut')}
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-white/85 px-4 backdrop-blur-xl lg:px-7">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Ic n='Gem' size={17} />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[16px] font-extrabold tracking-tight text-ink-950">{nav.find((n) => n.id === tab)?.label}</h1>
            <p className="truncate text-[11.5px] text-ink-400">{t(lang, 'adminGreeting')}</p>
          </div>

          <div className="flex items-center gap-2">
            <Segmented value={lang} onChange={(v) => setLang(v as Lang)} options={[{ value: 'en', label: 'EN' }, { value: 'ar', label: 'ع' }]} size="sm" />
            <Badge tone={site.settings.published ? 'success' : 'warning'} className="hidden sm:inline-flex">
              {site.settings.published ? t(lang, 'publishedSite') : t(lang, 'draftSite')}
            </Badge>
            <button type="button" className="btn-outline" onClick={() => window.open(`/site/${site.slug}`, '_blank')}>
              <Ic n='ExternalLink' size={15} />
              <span className="hidden sm:inline">{t(lang, 'viewSite')}</span>
            </button>
            <Dropdown trigger={({ toggle }) => <IconButton icon="MoreHorizontal" label={t(lang, 'menu')} onClick={toggle} />}>
              {({ close }) => (
                <>
                  <MenuItem icon="Gem" label={t(lang, 'editInBuilder')} onClick={() => { window.open(`/editor/${site.id}`, '_blank'); close() }} />
                  <MenuItem icon="LogOut" label={t(lang, 'signOut')} danger onClick={() => { onSignOut(); close() }} />
                </>
              )}
            </Dropdown>
          </div>
        </header>

        {/* mobile nav */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-[var(--border)] bg-white p-2.5 lg:hidden scrollbar-none">
          {nav.map((item) => {
            const Icon = resolveIcon(item.icon)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition', tab === item.id ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100')}
              >
                <Icon size={14} />
                {item.label}
              </button>
            )
          })}
        </div>

        <main className="flex-1 p-4 lg:p-7">
          {tab === 'overview' && <AdminOverview site={site} lang={lang} onTab={setTab} onExit={onExit} totalBlocks={totalBlocks} totalRecords={totalRecords} />}
          {tab === 'content' && <AdminContent site={site} lang={lang} />}
          {tab === 'pages' && <AdminPages site={site} lang={lang} />}
          {tab === 'media' && <AdminMedia site={site} lang={lang} />}
          {tab === 'brand' && <AdminBrand site={site} lang={lang} />}
          {tab === 'settings' && <AdminSettings site={site} lang={lang} />}
        </main>
      </div>
    </div>
  )
}

/* ---------------- overview ---------------- */

function AdminOverview({ site, lang, onTab, onExit, totalBlocks, totalRecords }: { site: Site; lang: Lang; onTab: (t: AdminTab) => void; onExit: () => void; totalBlocks: number; totalRecords: number }) {
  const collections = COLLECTION_KEYS.filter((k) => (site.collections[k]?.length ?? 0) > 0)
  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-ink-950 p-7 text-white lg:p-9">
        <div className="pointer-events-none absolute inset-0 mesh opacity-35" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/50">{site.industry}</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight lg:text-3xl">{t(lang, 'overviewGreeting')}</h2>
            <p className="mt-2 max-w-lg text-[14px] text-white/60">
              {site.pages.length} pages · {totalBlocks} sections · {totalRecords} content records
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="btn bg-white text-ink-950 hover:bg-white/90" onClick={onExit}>
              <Ic n='PencilRuler' size={15} />
              {t(lang, 'editInBuilder')}
            </button>
            <button type="button" className="btn glass text-white" onClick={() => window.open(`/site/${site.slug}`, '_blank')}>
              <Ic n='ExternalLink' size={15} />
              {t(lang, 'viewSite')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: 'Files', value: site.pages.length, label: t(lang, 'pages'), tone: 'brand' },
          { icon: 'Layers', value: totalBlocks, label: t(lang, 'sections'), tone: 'violet' },
          { icon: 'Database', value: totalRecords, label: t(lang, 'totalRecords'), tone: 'emerald' },
          { icon: 'Image', value: site.media.length, label: t(lang, 'media'), tone: 'amber' },
        ].map((stat) => {
          const Icon = resolveIcon(stat.icon)
          const tones: Record<string, string> = {
            brand: 'bg-brand-50 text-brand-600',
            violet: 'bg-violet-50 text-violet-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            amber: 'bg-amber-50 text-amber-600',
          }
          return (
            <div key={stat.label} className="rounded-3xl border border-[var(--border)] bg-white p-5 shadow-soft">
              <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-2xl', tones[stat.tone])}>
                <Icon size={20} />
              </span>
              <p className="mt-4 font-display text-3xl font-extrabold tabular-nums text-ink-950">{stat.value}</p>
              <p className="text-[12.5px] font-semibold text-ink-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-soft">
          <h3 className="mb-4 font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'collections')}</h3>
          {collections.length === 0 ? (
            <p className="text-[13px] text-ink-500">{t(lang, 'noRecords')}</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {collections.map((key) => {
                const schema = COLLECTIONS[key]
                const Icon = resolveIcon(schema.icon)
                const records = site.collections[key] ?? []
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onTab('content')}
                    className="flex items-center gap-3.5 rounded-2xl border border-ink-200 bg-white p-3.5 text-start transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft"
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-ink-900">{tr(schema.label, lang)}</span>
                      <span className="block truncate text-[11.5px] text-ink-500">{records.length} {t(lang, 'records')}</span>
                    </span>
                    <Ic n='ChevronRight' size={16} className="shrink-0 text-ink-400 rtl:rotate-180" />
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-soft">
            <h3 className="mb-4 font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'quickActions')}</h3>
            <div className="flex flex-col gap-2">
              {[
                { icon: 'Plus', label: t(lang, 'addRecord'), tab: 'content' as AdminTab },
                { icon: 'Upload', label: t(lang, 'uploadImage'), tab: 'media' as AdminTab },
                { icon: 'Palette', label: t(lang, 'appearance'), tab: 'brand' as AdminTab },
                { icon: 'Settings', label: t(lang, 'settings'), tab: 'settings' as AdminTab },
              ].map((a) => {
                const Icon = resolveIcon(a.icon)
                return (
                  <button key={a.label} type="button" onClick={() => onTab(a.tab)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-start text-[13px] font-semibold text-ink-700 transition hover:bg-ink-100">
                    <Icon size={16} className="text-brand-600" />
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-soft">
            <h3 className="mb-3 font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'liveUrl')}</h3>
            <div className="flex items-center gap-2 rounded-2xl bg-[var(--surface-2)] px-3.5 py-3">
              <Ic n='Globe' size={15} className="shrink-0 text-brand-600" />
              <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-700">/site/{site.slug}</code>
              <IconButton icon="Copy" label={t(lang, 'copyLink')} size="sm" onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}/site/${site.slug}`) }} />
            </div>
            <p className="mt-3 text-[11.5px] text-ink-400">{t(lang, 'storageNote')}</p>
          </div>
        </section>
      </div>
    </div>
  )
}

/* ---------------- content (collections) ---------------- */

function AdminContent({ site, lang }: { site: Site; lang: Lang }) {
  const store = useStudio()
  // Populated collections come first; the rest stay available so records can
  // be added to a collection the site has not used yet.
  const available = React.useMemo(
    () =>
      [...COLLECTION_KEYS].sort((a, b) => {
        const diff = (site.collections[b]?.length ?? 0) - (site.collections[a]?.length ?? 0)
        return diff !== 0 ? diff : COLLECTION_KEYS.indexOf(a) - COLLECTION_KEYS.indexOf(b)
      }),
    [site.collections],
  )
  const [active, setActive] = React.useState(COLLECTION_KEYS.find((k) => (site.collections[k]?.length ?? 0) > 0) ?? COLLECTION_KEYS[0])
  const [query, setQuery] = React.useState('')
  const [editing, setEditing] = React.useState<{ index: number | null; record: Record<string, any> } | null>(null)
  const [confirmIndex, setConfirmIndex] = React.useState<number | null>(null)

  const schema = COLLECTIONS[active]
  const records = site.collections[active] ?? []

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return records.map((r, i) => ({ r, i }))
    return records
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => JSON.stringify(r).toLowerCase().includes(q))
  }, [records, query])

  const blank = (): Record<string, any> => {
    const rec: Record<string, any> = {}
    schema.fields.forEach((f) => {
      rec[f.key] = f.type === 'boolean' ? false : f.type === 'price' ? { amount: 0, currency: 'USD' } : f.type === 'tags' ? [] : f.localized ? { en: '', ar: '' } : ''
    })
    return rec
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-none">
          {available.map((key) => {
            const Icon = resolveIcon(COLLECTIONS[key].icon)
            const count = (site.collections[key] ?? []).length
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setActive(key); setQuery('') }}
                className={cn('inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-[12.5px] font-bold transition', active === key ? 'border-brand-600 bg-brand-600 text-white shadow-soft' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300')}
              >
                <Icon size={14} />
                {tr(COLLECTIONS[key].label, lang)}
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', active === key ? 'bg-white/20' : 'bg-ink-100 text-ink-500')}>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <TextInput value={query} onChange={setQuery} placeholder={t(lang, 'search')} icon="Search" className="w-44" />
          <button type="button" className="btn-primary" onClick={() => setEditing({ index: null, record: blank() })}>
            <Ic n='Plus' size={15} />
            {t(lang, 'addRecord')}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--border)] bg-white shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-3.5">
          <div>
            <h3 className="font-display text-[14.5px] font-extrabold text-ink-950">{tr(schema.label, lang)}</h3>
            <p className="text-[11.5px] text-ink-400">{tr(schema.description, lang)}</p>
          </div>
          <Badge tone="neutral">{records.length} {t(lang, 'records')}</Badge>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={schema.icon}
              title={query ? t(lang, 'noResults') : t(lang, 'noRecords')}
              message={query ? `Nothing matches “${query}”.` : `Add your first ${tr(schema.label, lang).toLowerCase()} item.`}
              action={
                !query ? (
                  <button type="button" className="btn-primary" onClick={() => setEditing({ index: null, record: blank() })}>
                    <Ic n='Plus' size={15} />
                    {t(lang, 'addRecord')}
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filtered.map(({ r, i }) => (
              <div key={i} className="flex items-center gap-4 p-4 transition hover:bg-[var(--surface-2)]">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  {r.image || r.photo || r.avatar ? (
                    <img src={r.image ?? r.photo ?? r.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-ink-400"><Ic n={schema.icon} size={18} /></span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">{tr(r[schema.titleField], lang) || 'Untitled'}</p>
                  <p className="truncate text-[11.5px] text-ink-500">
                    {schema.fields
                      .slice(1, 4)
                      .map((f) => {
                        const v = r[f.key]
                        const text = f.type === 'price' ? `${v?.currency ?? ''} ${v?.amount ?? 0}` : f.type === 'tags' ? `${(v ?? []).length} tags` : f.localized ? tr(v, lang) : v
                        return text ? `${f.label.en}: ${String(text).slice(0, 24)}` : null
                      })
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton icon="Pencil" label={t(lang, 'editRecord')} size="sm" onClick={() => setEditing({ index: i, record: clone(r) })} />
                  <IconButton icon="Trash2" label={t(lang, 'deleteRecord')} size="sm" danger onClick={() => setConfirmIndex(i)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <RecordEditor
          schema={schema}
          site={site}
          lang={lang}
          record={editing.record}
          isNew={editing.index === null}
          onClose={() => setEditing(null)}
          onSave={(record) => {
            if (editing.index === null) store.addRecord(active, record)
            else store.updateRecord(active, editing.index, record)
            store.toast(t(lang, 'savedToast'))
            setEditing(null)
          }}
        />
      )}

      <ConfirmDialog
        open={confirmIndex !== null}
        onClose={() => setConfirmIndex(null)}
        onConfirm={() => {
          if (confirmIndex !== null) {
            store.deleteRecord(active, confirmIndex)
            store.toast(t(lang, 'savedToast'))
          }
        }}
        title={t(lang, 'deleteRecord')}
        message={t(lang, 'confirmDelete')}
        confirmLabel={t(lang, 'delete')}
      />
    </div>
  )
}

function RecordEditor({
  schema,
  site,
  lang,
  record,
  isNew,
  onClose,
  onSave,
}: {
  schema: (typeof COLLECTIONS)[string]
  site: Site
  lang: Lang
  record: Record<string, any>
  isNew: boolean
  onClose: () => void
  onSave: (record: Record<string, any>) => void
}) {
  const [draft, setDraft] = React.useState<Record<string, any>>(record)
  const set = (key: string, value: any) => setDraft((d) => ({ ...d, [key]: value }))

  const renderField = (field: CollectionField) => {
    const value = draft[field.key]
    switch (field.type) {
      case 'text':
        return field.localized ? (
          <div className="flex flex-col gap-1.5">
            <TextInput value={value?.en ?? ''} onChange={(v) => set(field.key, { ...(value ?? {}), en: v })} />
            <TextInput value={value?.ar ?? ''} onChange={(v) => set(field.key, { ...(value ?? {}), ar: v })} className="[direction:rtl]" />
          </div>
        ) : (
          <TextInput value={value ?? ''} onChange={(v) => set(field.key, v)} />
        )
      case 'longtext':
        return field.localized ? (
          <div className="flex flex-col gap-1.5">
            <TextArea value={value?.en ?? ''} onChange={(v) => set(field.key, { ...(value ?? {}), en: v })} rows={3} />
            <TextArea value={value?.ar ?? ''} onChange={(v) => set(field.key, { ...(value ?? {}), ar: v })} rows={3} />
          </div>
        ) : (
          <TextArea value={value ?? ''} onChange={(v) => set(field.key, v)} rows={3} />
        )
      case 'number':
        return <TextInput value={String(value ?? '')} onChange={(v) => set(field.key, Number(v) || 0)} type="number" />
      case 'price':
        return (
          <div className="flex gap-2">
            <TextInput value={String(value?.amount ?? 0)} onChange={(v) => set(field.key, { ...(value ?? {}), amount: Number(v) || 0 })} type="number" className="flex-1" />
            <Select value={value?.currency ?? 'USD'} onChange={(v) => set(field.key, { ...(value ?? {}), currency: v })} options={['USD', 'EUR', 'GBP', 'AED', 'SAR', 'TRY'].map((c) => ({ value: c, label: c }))} className="w-24" />
          </div>
        )
      case 'boolean':
        return <Toggle checked={!!value} onChange={(v) => set(field.key, v)} label={tr(field.label, lang)} />
      case 'select':
        return (
          <Select
            value={field.localized ? value?.en ?? '' : value ?? ''}
            onChange={(v) => set(field.key, field.localized ? { en: v, ar: v } : v)}
            options={[{ value: '', label: '—' }, ...(field.options ?? []).map((o) => ({ value: o, label: o }))]}
          />
        )
      case 'date':
        return <TextInput value={value ?? ''} onChange={(v) => set(field.key, v)} type="date" />
      case 'url':
        return <TextInput value={value ?? ''} onChange={(v) => set(field.key, v)} icon="Link" placeholder="https://…" />
      case 'image':
        return <ImagePicker value={value} onChange={(v) => set(field.key, v)} media={site.media} onAddMedia={useStudio.getState().addMedia} lang={lang} />
      case 'tags': {
        const list: any[] = Array.isArray(value) ? value : []
        const localized = field.localized
        return (
          <div className="flex flex-col gap-1.5">
            {list.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <TextInput value={localized ? tr(t, lang) : String(t)} onChange={(v) => {
                  const next = [...list]
                  next[i] = localized ? { ...(typeof t === 'object' ? t : {}), [lang]: v } : v
                  set(field.key, next)
                }} />
                <IconButton icon="Trash2" label={t(lang, 'remove')} size="sm" danger onClick={() => set(field.key, list.filter((_, idx) => idx !== i))} />
              </div>
            ))}
            <button type="button" className="btn-outline w-fit" onClick={() => set(field.key, [...list, localized ? { en: '', ar: '' } : ''])}>
              <Ic n='Plus' size={14} />
              {t(lang, 'add')}
            </button>
          </div>
        )
      }
      default:
        return null
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? `${t(lang, 'addRecord')} — ${tr(schema.label, lang)}` : `${t(lang, 'editRecord')} — ${tr(schema.label, lang)}`}
      subtitle={tr(schema.description, lang)}
      icon={schema.icon}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-outline" onClick={onClose}>{t(lang, 'cancel')}</button>
          <button type="button" className="btn-primary" onClick={() => onSave(draft)}>
            <Ic n='Check' size={15} />
            {t(lang, 'save')}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {schema.fields.map((field) => (
          <Field key={field.key} label={tr(field.label, lang)} className={cn((field.type === 'longtext' || field.type === 'tags') && 'sm:col-span-2')}>
            {renderField(field)}
          </Field>
        ))}
      </div>
    </Modal>
  )
}

/* ---------------- pages ---------------- */

function AdminPages({ site, lang }: { site: Site; lang: Lang }) {
  const store = useStudio()
  const [editing, setEditing] = React.useState<string | null>(null)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {site.pages.map((page) => (
        <div key={page.id} className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Ic n='FileText' size={19} />
            </span>
            <Badge tone={page.showInNav !== false ? 'brand' : 'neutral'}>{page.showInNav !== false ? 'In nav' : 'Hidden'}</Badge>
          </div>
          <div>
            <h3 className="font-display text-[15px] font-extrabold text-ink-950">{tr(page.name, lang)}</h3>
            <code className="mt-1 block font-mono text-[11.5px] text-ink-400">{page.path}</code>
          </div>
          <p className="text-[12.5px] text-ink-500">{page.blocks.length} sections · {page.blocks.filter((b) => !b.hidden).length} visible</p>

          <div className="mt-auto flex gap-2">
            <button type="button" className="btn-outline flex-1" onClick={() => setEditing(page.id)}>
              <Ic n='Pencil' size={14} />
              {t(lang, 'settings')}
            </button>
            <button type="button" className="btn-primary flex-1" onClick={() => window.open(`/editor/${site.id}`, '_blank')}>
              <Ic n='PencilRuler' size={14} />
              {t(lang, 'editor')}
            </button>
          </div>

          {editing === page.id && (
            <Modal
              open
              onClose={() => setEditing(null)}
              title={t(lang, 'pageSettings')}
              icon="FileText"
              footer={<button type="button" className="btn-primary" onClick={() => { store.toast(t(lang, 'savedToast')); setEditing(null) }}>{t(lang, 'save')}</button>}
            >
              <div className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t(lang, 'nameEn')}><TextInput value={page.name.en} onChange={(v) => store.updatePage(page.id, { name: { ...page.name, en: v } })} /></Field>
                  <Field label={t(lang, 'nameAr')}><TextInput value={page.name.ar} onChange={(v) => store.updatePage(page.id, { name: { ...page.name, ar: v } })} /></Field>
                </div>
                <Field label={t(lang, 'path')}><TextInput value={page.path} onChange={(v) => store.updatePage(page.id, { path: v.startsWith('/') ? v : `/${v}` })} /></Field>
                <Toggle checked={page.showInNav !== false} onChange={(v) => store.updatePage(page.id, { showInNav: v })} label={t(lang, 'showInNav')} />
              </div>
            </Modal>
          )}
        </div>
      ))}
    </div>
  )
}

/* ---------------- media ---------------- */

function AdminMedia({ site, lang }: { site: Site; lang: Lang }) {
  const store = useStudio()
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-soft">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'media')}</h3>
            <p className="text-[12px] text-ink-400">{site.media.length} assets · stored in this browser</p>
          </div>
          <button type="button" className="btn-outline" onClick={() => downloadJson(`${site.slug}-media.json`, site.media)}>
            <Ic n='Download' size={15} />
            {t(lang, 'export')}
          </button>
        </div>
        <MediaGrid media={site.media} onAdd={store.addMedia} onRemove={store.removeMedia} lang={lang} />
      </div>
    </div>
  )
}

/* ---------------- brand ---------------- */

function AdminBrand({ site, lang }: { site: Site; lang: Lang }) {
  const store = useStudio()
  const stops = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
  const presets = [
    { name: 'indigo', label: 'Indigo' },
    { name: 'ocean', label: 'Ocean' },
    { name: 'emerald', label: 'Emerald' },
    { name: 'amber', label: 'Amber' },
    { name: 'rose', label: 'Rose' },
    { name: 'violet', label: 'Violet' },
    { name: 'slate', label: 'Slate' },
    { name: 'crimson', label: 'Crimson' },
  ]

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-soft">
        <h3 className="mb-4 font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'themePreset')}</h3>
        <div className="grid grid-cols-4 gap-3">
          {presets.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => store.applyBrandPreset(p.name)}
              className={cn('flex flex-col items-center gap-2 rounded-2xl border p-2.5 transition', site.theme.preset === p.name ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:-translate-y-0.5 hover:border-brand-300')}
            >
              <span className="h-8 w-full rounded-lg" style={{ background: `linear-gradient(135deg, var(--brand-400), var(--brand-700))` }} />
              <span className="text-[11px] font-bold text-ink-700">{p.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex h-10 overflow-hidden rounded-xl border border-ink-200">
          {stops.map((s) => (
            <span key={s} className="flex-1" style={{ background: `var(--brand-${s})` }} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-soft">
        <h3 className="font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'appearance')}</h3>
        <Field label={t(lang, 'logo')}>
          <ImagePicker value={site.logo} onChange={(v) => store.updateSite(site.id, { logo: v })} media={site.media} onAddMedia={store.addMedia} label={t(lang, 'siteLogo')} lang={lang} />
        </Field>
        <Field label={t(lang, 'brandColour600')}>
          <TextInput value={site.theme.brand['600']} onChange={(v) => store.updateTheme({ brand: { ...site.theme.brand, '600': v }, preset: 'custom' })} />
        </Field>
        <Field label={t(lang, 'pageBackground')}>
          <TextInput value={site.theme.pageBg} onChange={(v) => store.updateTheme({ pageBg: v })} />
        </Field>
        <Toggle checked={site.theme.mode === 'dark'} onChange={(v) => store.updateTheme({ mode: v ? 'dark' : 'light' })} label={t(lang, 'darkMode')} />
        <p className="rounded-2xl bg-[var(--surface-2)] p-3 text-[11.5px] leading-relaxed text-ink-500">
          {t(lang, 'themeHint')}
        </p>
      </section>
    </div>
  )
}

/* ---------------- settings ---------------- */

function AdminSettings({ site, lang }: { site: Site; lang: Lang }) {
  const store = useStudio()
  const [showPassword, setShowPassword] = React.useState(false)
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-soft">
        <h3 className="font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'siteSettings')}</h3>
        <Field label={t(lang, 'siteName')}><TextInput value={site.name} onChange={(v) => store.updateSite(site.id, { name: v })} /></Field>
        <Field label={t(lang, 'seoTitle')}>
          <div className="flex flex-col gap-1.5">
            <TextInput value={site.settings.seo.title.en} onChange={(v) => store.updateSettings({ seo: { ...site.settings.seo, title: { ...site.settings.seo.title, en: v } } })} />
            <TextInput value={site.settings.seo.title.ar} onChange={(v) => store.updateSettings({ seo: { ...site.settings.seo, title: { ...site.settings.seo.title, ar: v } } })} />
          </div>
        </Field>
        <Field label={t(lang, 'seoDescription')}>
          <div className="flex flex-col gap-1.5">
            <TextArea value={site.settings.seo.description.en} onChange={(v) => store.updateSettings({ seo: { ...site.settings.seo, description: { ...site.settings.seo.description, en: v } } })} rows={2} />
            <TextArea value={site.settings.seo.description.ar} onChange={(v) => store.updateSettings({ seo: { ...site.settings.seo, description: { ...site.settings.seo.description, ar: v } } })} rows={2} />
          </div>
        </Field>
        <Toggle checked={site.settings.published} onChange={(v) => store.updateSettings({ published: v })} label={t(lang, 'published')} />
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-soft">
        <h3 className="font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'adminCredentials')}</h3>
        <Field label={t(lang, 'name')}><TextInput value={site.admin.name} onChange={(v) => store.updateAdmin({ name: v })} /></Field>
        <Field label={t(lang, 'email')}><TextInput value={site.admin.email} onChange={(v) => store.updateAdmin({ email: v })} icon="Mail" /></Field>
        <Field label={t(lang, 'password')}>
          <div className="relative">
            <TextInput value={site.admin.password} onChange={(v) => store.updateAdmin({ password: v })} type={showPassword ? 'text' : 'password'} />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-500">
              <Ic n={showPassword ? 'EyeOff' : 'Eye'} size={15} />
            </button>
          </div>
        </Field>
        <Field label={t(lang, 'languages')}>
          <div className="flex flex-col gap-2.5">
            {(['en', 'ar'] as Lang[]).map((code) => (
              <Toggle
                key={code}
                checked={site.settings.languages.includes(code)}
                onChange={(v) => store.updateSettings({ languages: v ? [...new Set([...site.settings.languages, code])] : site.settings.languages.filter((l) => l !== code) })}
                label={code === 'en' ? 'English (LTR)' : 'العربية (RTL)'}
              />
            ))}
          </div>
        </Field>
        <Field label={t(lang, 'customDomain')}><TextInput value={site.settings.customDomain ?? ''} onChange={(v) => store.updateSettings({ customDomain: v })} icon="Globe" /></Field>
        <button type="button" className="btn-outline" onClick={() => downloadJson(`${site.slug}-backup.json`, site)}>
          <Ic n='Download' size={15} />
          {t(lang, 'export')} JSON
        </button>
      </section>
    </div>
  )
}
