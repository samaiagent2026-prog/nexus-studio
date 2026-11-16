import React from 'react'
import { resolveIcon, Ic } from '../../lib/icons'
import { COLLECTIONS, COLLECTION_KEYS } from '../../lib/collections'
import type { Lang, LocalizedText, Page, Site, SiteSettings } from '../../lib/types'
import { cn, slugify, tr } from '../../lib/utils'
import { Badge, ConfirmDialog, Field, IconButton, Segmented, Select, TextArea, TextInput, Toggle, Tooltip } from '../ui'
import { ImagePicker } from './ImagePicker'
import { t } from '../../lib/i18n'

/* ============================================================
   Page, settings, navigation and data panels for the editor.
   ============================================================ */

export function PagesPanel({
  site,
  activePageId,
  onSelectPage,
  onAddPage,
  onUpdatePage,
  onDeletePage,
  lang,
}: {
  site: Site
  activePageId: string | null
  onSelectPage: (id: string) => void
  onAddPage: (name: string, path: string) => void
  onUpdatePage: (id: string, patch: Partial<Page>) => void
  onDeletePage: (id: string) => void
  lang: Lang
}) {
  const [adding, setAdding] = React.useState(false)
  const [name, setName] = React.useState('')
  const [path, setPath] = React.useState('/')
  const [confirmId, setConfirmId] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3 p-3.5">
      {site.pages.map((page) => {
        const active = page.id === activePageId
        return (
          <div key={page.id} className={cn('rounded-2xl border p-3 transition', active ? 'border-brand-500 bg-brand-50/60' : 'border-ink-200 bg-white hover:border-brand-300')}>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onSelectPage(page.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-start">
                <span className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600')}>
                  <Ic n='FileText' size={15} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-bold text-ink-900">{tr(page.name, lang)}</span>
                  <span className="block truncate font-mono text-[10.5px] text-ink-400">{page.path}</span>
                </span>
              </button>
              <Badge tone="neutral">{page.blocks.length}</Badge>
              {site.pages.length > 1 && (
                <IconButton icon="Trash2" label={t(lang, 'deletePage')} size="sm" danger onClick={() => setConfirmId(page.id)} />
              )}
            </div>

            {active && (
              <div className="mt-3 flex flex-col gap-2.5 border-t border-[var(--border)] pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t(lang, 'nameEn')}><TextInput value={page.name.en} onChange={(v) => onUpdatePage(page.id, { name: { ...page.name, en: v } })} /></Field>
                  <Field label={t(lang, 'nameAr')}><TextInput value={page.name.ar} onChange={(v) => onUpdatePage(page.id, { name: { ...page.name, ar: v } })} /></Field>
                </div>
                <Field label={t(lang, 'path')} hint={t(lang, 'pathHint')}>
                  <TextInput value={page.path} onChange={(v) => onUpdatePage(page.id, { path: v.startsWith('/') ? v : `/${v}` })} />
                </Field>
                <Toggle checked={page.showInNav !== false} onChange={(v) => onUpdatePage(page.id, { showInNav: v })} label={t(lang, 'showInNav')} />
                <div className="grid grid-cols-2 gap-2">
                  <Field label={t(lang, 'seoTitleEn')}><TextInput value={page.seo?.title?.en ?? ''} onChange={(v) => onUpdatePage(page.id, { seo: { ...page.seo, title: { en: v, ar: page.seo?.title?.ar ?? '' } } })} /></Field>
                  <Field label={t(lang, 'seoTitleAr')}><TextInput value={page.seo?.title?.ar ?? ''} onChange={(v) => onUpdatePage(page.id, { seo: { ...page.seo, title: { en: page.seo?.title?.en ?? '', ar: v } } })} /></Field>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {adding ? (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-brand-300 bg-brand-50/60 p-3">
          <Field label={t(lang, 'pageName')}><TextInput value={name} onChange={setName} placeholder={t(lang, 'pageNamePlaceholder')} /></Field>
          <Field label={t(lang, 'path')}><TextInput value={path} onChange={setPath} placeholder="/about" /></Field>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={!name.trim()}
              onClick={() => {
                onAddPage(name.trim(), path.startsWith('/') ? path : `/${slugify(path || name)}`)
                setName('')
                setPath('/')
                setAdding(false)
              }}
            >
              <Ic n='Plus' size={14} />
              {t(lang, 'createPage')}
            </button>
            <button type="button" className="btn-outline" onClick={() => setAdding(false)}>{t(lang, 'cancel')}</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn-outline w-full justify-center border-dashed" onClick={() => setAdding(true)}>
          <Ic n='Plus' size={14} />
          {t(lang, 'addPage')}
        </button>
      )}

      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={() => confirmId && onDeletePage(confirmId)}
        title={t(lang, 'deletePage')}
        message={t(lang, 'deletePageMessage')}
        confirmLabel={t(lang, 'deletePage')}
      />
    </div>
  )
}

export function SettingsPanel({
  site,
  onSettings,
  onAdmin,
  onAddMedia,
  onExport,
  onImport,
  onReset,
  lang,
}: {
  site: Site
  onSettings: (patch: Partial<SiteSettings>) => void
  onAdmin: (patch: Partial<Site['admin']>) => void
  onAddMedia: (assets: Site['media']) => void
  onExport: () => void
  onImport: (json: string) => void
  onReset: () => void
  lang: Lang
}) {
  const s = site.settings
  const [importText, setImportText] = React.useState('')
  const [showImport, setShowImport] = React.useState(false)
  const [showReset, setShowReset] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className="flex flex-col gap-5 p-3.5">
      <section className="flex flex-col gap-3">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'siteSection')}</h4>
        <Field label={t(lang, 'siteName')}><TextInput value={site.name} onChange={(v) => onSettings({ seo: { ...s.seo, title: { en: v, ar: s.seo.title.ar } } })} /></Field>
        <Field label={t(lang, 'logo')}>
          <ImagePicker value={site.logo} onChange={(v) => onSettings({ favicon: v })} media={site.media} onAddMedia={onAddMedia} label={t(lang, 'logo')} lang={lang} />
        </Field>
        <Field label={t(lang, 'customDomain')}><TextInput value={s.customDomain ?? ''} onChange={(v) => onSettings({ customDomain: v })} placeholder="www.example.com" icon="Globe" /></Field>
        <Toggle checked={s.published} onChange={(v) => onSettings({ published: v })} label={t(lang, 'published')} hint={t(lang, 'publishHint')} />
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'languages')}</h4>
        <div className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-3">
          {(['en', 'ar'] as Lang[]).map((code) => (
            <Toggle
              key={code}
              checked={s.languages.includes(code)}
              onChange={(v) => onSettings({ languages: v ? [...new Set([...s.languages, code])] : s.languages.filter((l) => l !== code) })}
              label={code === 'en' ? 'English (LTR)' : 'العربية (RTL)'}
              hint={code === 'ar' ? t(lang, 'rtlHint') : t(lang, 'ltrHint')}
            />
          ))}
          <Field label={t(lang, 'defaultLanguage')}>
            <Segmented value={s.defaultLang} onChange={(v) => onSettings({ defaultLang: v })} options={[{ value: 'en' as Lang, label: 'English' }, { value: 'ar' as Lang, label: 'العربية' }]} className="w-full [&>button]:flex-1" />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'seo')}</h4>
        <div className="flex flex-col gap-1.5">
          <span className="label">{t(lang, 'metaTitle')}</span>
          <TextInput value={s.seo.title.en} onChange={(v) => onSettings({ seo: { ...s.seo, title: { ...s.seo.title, en: v } } })} />
          <TextInput value={s.seo.title.ar} onChange={(v) => onSettings({ seo: { ...s.seo, title: { ...s.seo.title, ar: v } } })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="label">{t(lang, 'metaDescription')}</span>
          <TextArea value={s.seo.description.en} onChange={(v) => onSettings({ seo: { ...s.seo, description: { ...s.seo.description, en: v } } })} rows={2} />
          <TextArea value={s.seo.description.ar} onChange={(v) => onSettings({ seo: { ...s.seo, description: { ...s.seo.description, ar: v } } })} rows={2} />
        </div>
        <Field label={t(lang, 'keywords')}><TextInput value={s.seo.keywords} onChange={(v) => onSettings({ seo: { ...s.seo, keywords: v } })} placeholder="real estate, apartments" /></Field>
        <Field label={t(lang, 'analytics')}><TextInput value={s.analyticsId ?? ''} onChange={(v) => onSettings({ analyticsId: v })} placeholder="G-XXXXXXX" icon="Activity" /></Field>
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'clientAdminLogin')}</h4>
        <div className="flex flex-col gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <Field label={t(lang, 'adminName')}><TextInput value={site.admin.name} onChange={(v) => onAdmin({ name: v })} /></Field>
          <Field label={t(lang, 'email')}><TextInput value={site.admin.email} onChange={(v) => onAdmin({ email: v })} icon="Mail" /></Field>
          <Field label={t(lang, 'password')}>
            <div className="relative">
              <TextInput value={site.admin.password} onChange={(v) => onAdmin({ password: v })} type={showPassword ? 'text' : 'password'} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-ink-500">
                <Ic n={showPassword ? 'EyeOff' : 'Eye'} size={15} />
              </button>
            </div>
          </Field>
          <p className="text-[11px] leading-snug text-amber-800">
            {t(lang, 'adminShareHint')} <code className="font-mono">/admin</code>
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'dataSection')}</h4>
        <div className="flex gap-2">
          <button type="button" className="btn-outline flex-1" onClick={onExport}>
            <Ic n='Download' size={14} />
            {t(lang, 'exportLabel')}
          </button>
          <button type="button" className="btn-outline flex-1" onClick={() => setShowImport((v) => !v)}>
            <Ic n='Upload' size={14} />
            {t(lang, 'importLabel')}
          </button>
        </div>
        {showImport && (
          <div className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white p-3">
            <TextArea value={importText} onChange={setImportText} rows={5} placeholder={t(lang, 'pasteJson')} />
            <button
              type="button"
              className="btn-primary"
              disabled={!importText.trim()}
              onClick={() => {
                onImport(importText)
                setImportText('')
                setShowImport(false)
              }}
            >
              {t(lang, 'applyImport')}
            </button>
          </div>
        )}
        <button type="button" className="btn-outline border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => setShowReset(true)}>
          <Ic n='RotateCcw' size={14} />
          {t(lang, 'resetToTemplate')}
        </button>
      </section>

      <ConfirmDialog
        open={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={onReset}
        title={t(lang, 'resetSiteTitle')}
        message={t(lang, 'resetSiteMessage')}
        confirmLabel={t(lang, 'resetSiteTitle')}
      />
    </div>
  )
}

export function DataPanel({ site, lang }: { site: Site; lang: Lang }) {
  const [open, setOpen] = React.useState<string | null>(COLLECTION_KEYS.find((k) => (site.collections[k]?.length ?? 0) > 0) ?? null)

  return (
    <div className="flex flex-col gap-2.5 p-3.5">
      <p className="rounded-2xl bg-brand-50 p-3 text-[11.5px] leading-relaxed text-brand-800">
        {t(lang, 'collectionsHintPre')} <code className="font-mono">/admin</code>.
      </p>
      {COLLECTION_KEYS.map((key) => {
        const schema = COLLECTIONS[key]
        const records = site.collections[key] ?? []
        const isOpen = open === key
        const Icon = resolveIcon(schema.icon)
        return (
          <div key={key} className="rounded-2xl border border-ink-200 bg-white">
            <button type="button" onClick={() => setOpen(isOpen ? null : key)} className="flex w-full items-center gap-2.5 p-3 text-start">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
                <Icon size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-bold text-ink-900">{tr(schema.label, lang)}</span>
                <span className="block truncate text-[10.5px] text-ink-400">{records.length} {t(lang, 'records')}</span>
              </span>
              <Ic n={isOpen ? 'ChevronUp' : 'ChevronDown'} size={15} className="shrink-0 text-ink-400" />
            </button>
            {isOpen && (
              <div className="border-t border-[var(--border)] p-3">
                <div className="flex flex-col gap-1.5">
                  {records.slice(0, 5).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-2.5 py-2">
                      <span className="text-[10.5px] font-bold text-ink-400">{i + 1}</span>
                      <span className="truncate text-[12px] font-semibold text-ink-700">{tr(r[schema.titleField], lang) || t(lang, 'untitled')}</span>
                    </div>
                  ))}
                  {records.length > 5 && <p className="text-center text-[11px] text-ink-400">+{records.length - 5} {t(lang, 'more')}</p>}
                  {records.length === 0 && <p className="py-3 text-center text-[11.5px] text-ink-500">{t(lang, 'noRecords')}</p>}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
