import React from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveIcon, Ic } from '../lib/icons'
import { t } from '../lib/i18n'
import { dirFor } from '../lib/dir'
import { applyTheme } from '../lib/theme'
import { TEMPLATES, instantiateTemplate, blankSite, type TemplateDef } from '../lib/templates'
import { downloadSiteBundle } from '../lib/export/site'
import { clone, downloadJson, formatDate, slugify, tr } from '../lib/utils'
import { Badge, ConfirmDialog, Dropdown, EmptyState, Field, IconButton, MenuItem, Modal, Segmented, TextInput, Tooltip } from '../components/ui'
import { useStudio } from '../store/studio'
import type { Site } from '../lib/types'
import { cn } from '../lib/utils'

/* ============================================================
   Dashboard: multi-tenant site management + template gallery.
   ============================================================ */

export function DashboardPage() {
  const navigate = useNavigate()
  const { sites, addSite, deleteSite, duplicateSite, updateSite, setActiveSite, toast, lang, setLang } = useStudio()
  const [query, setQuery] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [browsing, setBrowsing] = React.useState(false)
  const [confirm, setConfirm] = React.useState<Site | null>(null)
  const [renaming, setRenaming] = React.useState<Site | null>(null)
  const [renameValue, setRenameValue] = React.useState('')
  const themeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    applyTheme(themeRef.current, { ...sites[0]?.theme, mode: 'light', pageBg: '#f6f7f9' } as any)
  }, [sites])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sites
    return sites.filter((s) => s.name.toLowerCase().includes(q) || s.industry.toLowerCase().includes(q) || s.slug.includes(q))
  }, [sites, query])

  const openSite = (site: Site) => {
    setActiveSite(site.id)
    navigate(`/editor/${site.id}`)
  }

  const handleCreate = (input: { name: string; industry: string; templateId?: string }) => {
    const site = input.templateId ? instantiateTemplate(input.templateId, { name: input.name }) : blankSite({ name: input.name, industry: input.industry })
    addSite({ ...site, name: site.name } as any)
    // addSite builds a fresh document; replace with the templated one
    useStudio.setState((state) => ({
      sites: state.sites.map((s) => (s.id === state.activeSiteId ? site : s)),
      activePageId: site.pages[0]?.id ?? null,
    }))
    toast(`“${input.name}” created`)
    setCreating(false)
    setBrowsing(false)
    navigate(`/editor/${site.id}`)
  }

  const totalBlocks = sites.reduce((sum, s) => sum + s.pages.reduce((n, p) => n + p.blocks.length, 0), 0)
  const totalRecords = sites.reduce((sum, s) => sum + Object.values(s.collections).reduce((n, list) => n + list.length, 0), 0)

  return (
    <div ref={themeRef} dir={dirFor(lang)} className="min-h-screen bg-[var(--surface-2)]" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* ---------- top bar ---------- */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
              <Ic n='Gem' size={20} />
            </span>
            <div className="leading-tight">
              <p className="font-display text-[15px] font-extrabold tracking-tight text-ink-950">{t(lang, 'appName')}</p>
              <p className="text-[10.5px] font-medium text-ink-400">{t(lang, 'appTagline')}</p>
            </div>
          </div>

          <div className="mx-auto hidden max-w-md flex-1 lg:block">
            <TextInput value={query} onChange={setQuery} placeholder={t(lang, 'searchSites')} icon="Search" />
          </div>

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
            <button type="button" className="btn-outline hidden sm:inline-flex" onClick={() => setBrowsing(true)}>
              <Ic n='LayoutTemplate' size={15} />
              {t(lang, 'templates')}
            </button>
            <button type="button" className="btn-outline hidden sm:inline-flex" onClick={() => navigate('/downloads')}>
              <Ic n='FolderDown' size={15} />
              {t(lang, 'downloads')}
            </button>
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
              <Ic n='Plus' size={15} />
              {t(lang, 'createSite')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8 lg:py-10">
        {/* ---------- hero ---------- */}
        <section className="relative mb-10 overflow-hidden rounded-[32px] border border-[var(--border)] bg-ink-950 px-7 py-10 text-white lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-0 mesh opacity-40" />
          <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
                <Ic n='Sparkles' size={13} />
                {t(lang, 'appTagline')}
              </span>
              <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-balance lg:text-[2.6rem]">
                {t(lang, 'welcomeTitle')}
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-white/70 text-pretty">{t(lang, 'welcomeSubtitle')}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" className="btn bg-white text-ink-950 hover:bg-white/90" onClick={() => setBrowsing(true)}>
                  <Ic n='LayoutTemplate' size={16} />
                  {t(lang, 'browseTemplates')}
                </button>
                <button type="button" className="btn glass text-white" onClick={() => setCreating(true)}>
                  <Ic n='PenLine' size={16} />
                  {t(lang, 'startFromScratch')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 lg:gap-8">
              {[
                { value: sites.length, label: t(lang, 'mySites'), icon: 'Globe' },
                { value: totalBlocks, label: t(lang, 'sections'), icon: 'Layers' },
                { value: totalRecords, label: t(lang, 'records'), icon: 'Database' },
              ].map((stat) => {
                const Icon = resolveIcon(stat.icon)
                return (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur lg:p-5">
                    <Icon size={18} className="text-brand-300" />
                    <p className="mt-2.5 font-display text-2xl font-extrabold tabular-nums lg:text-3xl">{stat.value}</p>
                    <p className="text-[11.5px] font-medium text-white/60">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ---------- sites ---------- */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-ink-950">{t(lang, 'mySites')}</h2>
          <div className="flex items-center gap-2">
            <Badge tone="neutral" icon="HardDrive">{t(lang, 'storageNote')}</Badge>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="LayoutTemplate"
            title={query ? t(lang, 'noResults') : t(lang, 'emptySites')}
            message={query ? `Nothing matches “${query}”.` : 'Start from one of five industry templates or build a blank canvas from scratch.'}
            action={
              <div className="flex gap-2">
                <button type="button" className="btn-primary" onClick={() => setBrowsing(true)}>
                  <Ic n='LayoutTemplate' size={15} />
                  {t(lang, 'browseTemplates')}
                </button>
                <button type="button" className="btn-outline" onClick={() => setCreating(true)}>
                  <Ic n='Plus' size={15} />
                  {t(lang, 'startFromScratch')}
                </button>
              </div>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                lang={lang}
                onOpen={() => openSite(site)}
                onPreview={() => window.open(`/site/${site.slug}`, '_blank')}
                onRename={() => {
                  setRenaming(site)
                  setRenameValue(site.name)
                }}
                onDuplicate={() => {
                  const copy = duplicateSite(site.id)
                  if (copy) toast(`Duplicated “${site.name}”`)
                }}
                onTogglePublish={() => {
                  updateSite(site.id, { settings: { ...site.settings, published: !site.settings.published } })
                  toast(site.settings.published ? 'Moved to draft' : 'Site published')
                }}
                onExport={() => downloadJson(`${site.slug}.json`, site)}
                onDownload={() => {
                  const result = downloadSiteBundle(site, lang)
                  toast(`${t(lang, 'downloadSiteDone')} · ${result.files.length} ${t(lang, 'filesLabel')}`)
                }}
                onDelete={() => setConfirm(site)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ---------- create modal ---------- */}
      <CreateSiteModal open={creating} onClose={() => setCreating(false)} onCreate={handleCreate} lang={lang} />

      {/* ---------- template browser ---------- */}
      <Modal
        open={browsing}
        onClose={() => setBrowsing(false)}
        title={t(lang, 'templates')}
        subtitle={t(lang, 'templateBrowserSubtitle')}
        size="xl"
        icon="LayoutTemplate"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((template) => (
            <TemplateCard key={template.id} template={template} lang={lang} onUse={(name) => handleCreate({ name, industry: template.industry, templateId: template.id })} />
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            deleteSite(confirm.id)
            toast(`Deleted “${confirm.name}”`)
          }
        }}
        title={t(lang, 'deleteSiteTitle')}
        message={`“${confirm?.name}” ${t(lang, 'deleteSiteMessage')}`}
        confirmLabel={t(lang, 'deleteSiteTitle')}
      />

      <Modal
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title={t(lang, 'renameSite')}
        size="sm"
        icon="Pencil"
        footer={
          <>
            <button type="button" className="btn-outline" onClick={() => setRenaming(null)}>{t(lang, 'cancel')}</button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                if (renaming) {
                  updateSite(renaming.id, { name: renameValue, slug: slugify(renameValue) })
                  toast(t(lang, 'siteRenamed'))
                }
                setRenaming(null)
              }}
            >
              {t(lang, 'save')}
            </button>
          </>
        }
      >
        <Field label={t(lang, 'siteName')}>
          <TextInput value={renameValue} onChange={setRenameValue} />
        </Field>
        <p className="mt-2 text-[12px] text-ink-500">
          {t(lang, 'publicUrlBecomes')} <code className="font-mono text-ink-700">/site/{slugify(renameValue)}</code>
        </p>
      </Modal>
    </div>
  )
}

function SiteCard({
  site,
  lang,
  onOpen,
  onPreview,
  onRename,
  onDuplicate,
  onTogglePublish,
  onExport,
  onDownload,
  onDelete,
}: {
  site: Site
  lang: 'en' | 'ar'
  onOpen: () => void
  onPreview: () => void
  onRename: () => void
  onDuplicate: () => void
  onTogglePublish: () => void
  onExport: () => void
  onDownload: () => void
  onDelete: () => void
}) {
  const heroBlock = site.pages[0]?.blocks.find((b) => b.type === 'hero' || b.type === 'heroSearch' || b.type === 'banner')
  const image = heroBlock?.props?.image ?? heroBlock?.props?.backgroundImage ?? site.media[0]?.url
  const blocks = site.pages.reduce((n, p) => n + p.blocks.length, 0)
  const records = Object.values(site.collections).reduce((n, list) => n + list.length, 0)

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
      <button type="button" onClick={onOpen} className="relative block aspect-[16/10] overflow-hidden bg-ink-100 text-start">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center mesh">
            <Ic n='LayoutTemplate' size={30} className="text-white/70" />
          </span>
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />
        <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2">
          <span>
            <span className="block font-display text-[16px] font-extrabold text-white">{site.name}</span>
            <span className="mt-0.5 block text-[11.5px] font-medium text-white/70">{site.industry}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur">
            <Ic n='Layers' size={11} />
            {blocks}
          </span>
        </span>
        <span className="absolute end-3 top-3">
          <Badge tone={site.settings.published ? 'success' : 'warning'} className="shadow-soft">
            {site.settings.published ? t(lang, 'published') : t(lang, 'draft')}
          </Badge>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2 text-[11.5px] text-ink-500">
          <span className="inline-flex items-center gap-1.5 truncate font-mono">
            <Ic n='Link' size={12} />
            /site/{site.slug}
          </span>
          <span className="shrink-0">{formatDate(site.updatedAt, lang)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone="neutral" icon="Files">{site.pages.length} {t(lang, 'pages')}</Badge>
          <Badge tone="neutral" icon="Database">{records} {t(lang, 'records')}</Badge>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-ink-600" style={{ background: `linear-gradient(135deg, ${site.theme.brand['100']}, ${site.theme.brand['200']})` }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: site.theme.brand['600'] }} />
            {site.theme.preset}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <button type="button" className="btn-primary flex-1" onClick={onOpen}>
            <Ic n='PencilRuler' size={15} />
            {t(lang, 'editor')}
          </button>
          <IconButton icon="ExternalLink" label={t(lang, 'viewSite')} onClick={onPreview} className="border border-ink-200" />
          <IconButton icon="ShieldCheck" label={t(lang, 'adminPanel')} onClick={() => window.open(`/admin?site=${site.slug}`, '_blank')} className="border border-ink-200" />
          <Dropdown
            trigger={({ toggle }) => <IconButton icon="MoreHorizontal" label={t(lang, 'more')} onClick={toggle} className="border border-ink-200" />}
          >
            {({ close }) => (
              <>
                <MenuItem icon="Pencil" label={t(lang, 'rename')} onClick={() => { onRename(); close() }} />
                <MenuItem icon="Copy" label={t(lang, 'duplicate')} onClick={() => { onDuplicate(); close() }} />
                <MenuItem icon="FolderDown" label={t(lang, 'downloadSite')} onClick={() => { onDownload(); close() }} />
                <MenuItem icon="Download" label={t(lang, 'export')} onClick={() => { onExport(); close() }} />
                <MenuItem icon={site.settings.published ? 'EyeOff' : 'Globe'} label={site.settings.published ? t(lang, 'unpublish') : t(lang, 'publish')} onClick={() => { onTogglePublish(); close() }} />
                <div className="my-1 h-px bg-ink-100" />
                <MenuItem icon="Trash2" label={t(lang, 'delete')} danger onClick={() => { onDelete(); close() }} />
              </>
            )}
          </Dropdown>
        </div>
      </div>
    </article>
  )
}

function TemplateCard({ template, lang, onUse }: { template: TemplateDef; lang: 'en' | 'ar'; onUse: (name: string) => void }) {
  const Icon = resolveIcon(template.icon)
  const [name, setName] = React.useState(template.name)
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
      <div className={cn('relative flex h-32 items-center justify-center bg-gradient-to-br', template.gradient)}>
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-30" />
        <Icon size={40} className="relative text-white/95" />
        <span className="absolute end-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur">{template.industry}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-[15.5px] font-extrabold text-ink-950">{template.name}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{tr(template.description, lang)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {template.collections.slice(0, 4).map((c) => (
            <span key={c} className="chip">{c}</span>
          ))}
        </div>
        <Field label={t(lang, 'siteName')} className="mt-auto">
          <TextInput value={name} onChange={setName} />
        </Field>
        <button type="button" className="btn-primary w-full" onClick={() => onUse(name)}>
          <Ic n='Rocket' size={15} />
          {t(lang, 'useTemplate')}
        </button>
      </div>
    </article>
  )
}

function CreateSiteModal({
  open,
  onClose,
  onCreate,
  lang,
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { name: string; industry: string; templateId?: string }) => void
  lang: 'en' | 'ar'
}) {
  const [name, setName] = React.useState('')
  const [industry, setIndustry] = React.useState('General')
  const [templateId, setTemplateId] = React.useState<string>('')

  React.useEffect(() => {
    if (open) {
      setName('')
      setIndustry('General')
      setTemplateId('')
    }
  }, [open])

  const slug = slugify(name || 'untitled')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t(lang, 'newSite')}
      subtitle={t(lang, 'createSiteSubtitle')}
      icon="Plus"
      size="lg"
      footer={
        <>
          <button type="button" className="btn-outline" onClick={onClose}>{t(lang, 'cancel')}</button>
          <button type="button" className="btn-primary" disabled={!name.trim()} onClick={() => onCreate({ name: name.trim(), industry, templateId: templateId || undefined })}>
            <Ic n='Rocket' size={15} />
            {t(lang, 'createSite')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t(lang, 'siteName')}>
            <TextInput value={name} onChange={setName} placeholder={t(lang, 'siteNamePlaceholder')} />
          </Field>
          <Field label={t(lang, 'industry')}>
            <TextInput value={industry} onChange={setIndustry} placeholder={t(lang, 'industryPlaceholder')} />
          </Field>
        </div>
        <p className="rounded-2xl bg-[var(--surface-2)] px-3.5 py-2.5 text-[12px] text-ink-500">
          {t(lang, 'publicUrl')} <code className="font-mono text-ink-700">/site/{slug}</code>
        </p>

        <div>
          <span className="label">{t(lang, 'startingPoint')}</span>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => setTemplateId('')}
              className={cn('flex items-center gap-3 rounded-2xl border p-3 text-start transition', templateId === '' ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300')}
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
                <Ic n='PenLine' size={17} />
              </span>
              <span>
                <span className="block text-[12.5px] font-bold text-ink-900">{t(lang, 'startFromScratch')}</span>
                <span className="block text-[11px] text-ink-500">{t(lang, 'starterHero')}</span>
              </span>
            </button>
            {TEMPLATES.map((template) => {
              const Icon = resolveIcon(template.icon)
              const active = templateId === template.id
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setTemplateId(template.id)
                    if (!name.trim()) setName(template.name)
                    setIndustry(template.industry)
                  }}
                  className={cn('flex items-center gap-3 rounded-2xl border p-3 text-start transition', active ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300')}
                >
                  <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white', template.gradient)}>
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-bold text-ink-900">{template.name}</span>
                    <span className="block truncate text-[11px] text-ink-500">{template.industry}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
