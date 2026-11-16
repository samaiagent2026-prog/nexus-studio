import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resolveIcon, Ic } from '../lib/icons'
import { t } from '../lib/i18n'
import { dirFor } from '../lib/dir'
import { applyTheme } from '../lib/theme'
import { clone, downloadJson, tr } from '../lib/utils'
import { getBlockDef } from '../components/blocks/registry'
import { Canvas, CanvasPage } from '../components/builder/Canvas'
import { Inspector } from '../components/builder/Inspector'
import { LayersPanel, SectionLibrary } from '../components/builder/Library'
import { DesignPanel } from '../components/builder/DesignPanel'
import { DataPanel, PagesPanel, SettingsPanel } from '../components/builder/Panels'
import { Badge, ConfirmDialog, Dropdown, IconButton, MenuItem, Segmented, Tooltip } from '../components/ui'
import { pageBlocks, useActivePage, useActiveSite, useStudio } from '../store/studio'
import type { Device, Lang, Site } from '../lib/types'
import { cn } from '../lib/utils'

/* ============================================================
   Editor shell: left rail + canvas + inspector, with a full
   undo/redo history and instant theme application.
   ============================================================ */

type RailTab = 'insert' | 'layers' | 'pages' | 'design' | 'settings' | 'data'

export function EditorPage() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const site = useActiveSite()
  const page = useActivePage()
  const store = useStudio()

  const [rail, setRail] = React.useState<RailTab>('insert')
  const [railOpen, setRailOpen] = React.useState(true)
  const [inspectorTab, setInspectorTab] = React.useState<'content' | 'style' | 'advanced'>('content')
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null)
  const [pendingIndex, setPendingIndex] = React.useState<number | null>(null)
  const [showInspector, setShowInspector] = React.useState(true)
  const themeRef = React.useRef<HTMLDivElement>(null)

  /* activate the site when arriving via a direct URL */
  React.useEffect(() => {
    if (siteId && site?.id !== siteId) {
      const exists = useStudio.getState().sites.some((s) => s.id === siteId)
      if (exists) store.setActiveSite(siteId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId])

  /* keep language + theme in sync with the store */
  React.useEffect(() => {
    if (!site) return
    const handler = (e: Event) => store.setLang((e as CustomEvent).detail)
    window.addEventListener('nexus:set-lang', handler)
    return () => window.removeEventListener('nexus:set-lang', handler)
  }, [site, store])

  React.useEffect(() => {
    if (site) applyTheme(themeRef.current, site.theme)
  }, [site?.theme, site])

  /* keyboard shortcuts */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement
      const typing = target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        store.undo()
      } else if (meta && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault()
        store.redo()
      } else if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault()
        store.toast(t(store.lang, 'saved'))
      } else if (e.key === 'Escape' && !typing) {
        store.select(null)
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && store.selection && store.selection.elementKey === 'section') {
        e.preventDefault()
        store.removeBlock(store.selection.blockId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [store])

  if (!site || !page) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-ink-50">
        <Ic n='TriangleAlert' size={30} className="text-amber-500" />
        <p className="text-sm font-semibold text-ink-700">{t(store.lang, 'siteNotFoundHint')}</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>{t(store.lang, 'backToDashboard')}</button>
      </div>
    )
  }

  const selectedBlock = store.selection
    ? [site.header, ...page.blocks, site.footer].find((b) => b.id === store.selection!.blockId) ?? null
    : null
  const selectedDef = selectedBlock ? getBlockDef(selectedBlock.type) : undefined
  const blocksForLayers = pageBlocks(site, page)

  const handleImport = (json: string) => {
    try {
      const parsed = JSON.parse(json) as Site
      if (!parsed?.pages) throw new Error('invalid')
      store.replaceSite({ ...parsed, id: site.id, updatedAt: Date.now() })
      store.toast('Site imported')
    } catch {
      store.toast('That JSON could not be parsed', 'error')
    }
  }

  /* "Insert here" opens the library and remembers the drop position. */
  const handleInsert = (type: string, atIndex?: number) => {
    if (type === '__choose__') {
      setPendingIndex(atIndex ?? null)
      setRail('insert')
      setRailOpen(true)
      return
    }
    store.insertBlock(type, atIndex)
    setPendingIndex(null)
  }

  const handleReset = () => {
    store.toast('Reset is available from the dashboard', 'info')
  }

  return (
    <div ref={themeRef} className="flex h-screen flex-col overflow-hidden bg-ink-100" dir={dirFor(store.lang)}>
      {/* ---------- top bar ---------- */}
      <header className="z-40 flex h-14 shrink-0 items-center gap-2 border-b border-ink-200 bg-white px-2.5 sm:px-3">
        <button type="button" onClick={() => navigate('/')} className="btn-ghost !px-2" title={t(store.lang, 'backToDashboard')}>
          <Ic n='ChevronLeft' size={18} className={cn(store.lang === 'ar' && 'rotate-180')} />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
            <Ic n='Gem' size={16} />
          </span>
          <div className="hidden min-w-0 leading-tight sm:block">
            <p className="truncate text-[13px] font-extrabold text-ink-950">{site.name}</p>
            <p className="truncate text-[10.5px] text-ink-400">{tr(page.name, store.lang)}</p>
          </div>
        </div>

        <div className="mx-2 hidden items-center gap-1 lg:flex">
          <ToolbarBtn icon="Undo2" label={t(store.lang, 'undoShortcut')} disabled={store.past.length === 0} onClick={store.undo} />
          <ToolbarBtn icon="Redo2" label={t(store.lang, 'redoShortcut')} disabled={store.future.length === 0} onClick={store.redo} />
        </div>

        <div className="flex flex-1 items-center justify-center gap-2">
          <Segmented
            value={store.device}
            onChange={(v) => store.setDevice(v as Device)}
            options={[
              { value: 'desktop', icon: 'Monitor', title: 'Desktop' },
              { value: 'tablet', icon: 'Tablet', title: 'Tablet' },
              { value: 'mobile', icon: 'Smartphone', title: 'Mobile' },
            ]}
            size="sm"
          />
          <Segmented
            value={store.lang}
            onChange={(v) => store.setLang(v as 'en' | 'ar')}
            options={[
              { value: 'en', label: 'EN', title: 'English (LTR)' },
              { value: 'ar', label: 'ع', title: 'العربية (RTL)' },
            ]}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Badge tone={site.settings.published ? 'success' : 'warning'} icon={site.settings.published ? 'Globe' : 'EyeOff'} className="hidden sm:inline-flex">
            {site.settings.published ? t(store.lang, 'publishedLabel') : t(store.lang, 'draftLabel')}
          </Badge>
          <Tooltip label={store.editMode ? t(store.lang, 'previewMode') : t(store.lang, 'editMode')}>
            <button
              type="button"
              onClick={() => store.setEditMode(!store.editMode)}
              className={cn('inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold transition', store.editMode ? 'bg-ink-950 text-white' : 'bg-brand-600 text-white')}
            >
              <Ic n={store.editMode ? 'Play' : 'PencilRuler'} size={14} />
              <span className="hidden sm:inline">{store.editMode ? t(store.lang, 'previewLabel') : t(store.lang, 'editLabel')}</span>
            </button>
          </Tooltip>
          <IconButton icon={showInspector ? 'PanelRightClose' : 'PanelRightOpen'} label={t(store.lang, 'settings')} onClick={() => setShowInspector((v) => !v)} />
          <button type="button" className="btn-primary !px-3" onClick={() => window.open(`/site/${site.slug}/${page.path === '/' ? '' : page.path.slice(1)}`, '_blank')}>
            <Ic n='ExternalLink' size={15} />
            <span className="hidden sm:inline">{t(store.lang, 'viewSiteLabel')}</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ---------- left rail ---------- */}
        <nav className="z-30 flex w-14 shrink-0 flex-col items-center gap-1 border-e border-ink-200 bg-white py-2.5">
          {(
            [
              { id: 'insert', icon: 'PlusCircle', label: t(store.lang, 'sections') },
              { id: 'layers', icon: 'Layers', label: t(store.lang, 'layers') },
              { id: 'pages', icon: 'Files', label: t(store.lang, 'pages') },
              { id: 'design', icon: 'Palette', label: t(store.lang, 'design') },
              { id: 'data', icon: 'Database', label: t(store.lang, 'contentTab') },
              { id: 'settings', icon: 'Settings', label: t(store.lang, 'settings') },
            ] as { id: RailTab; icon: string; label: string }[]
          ).map((item) => {
            const Icon = resolveIcon(item.icon)
            const active = rail === item.id && railOpen
            return (
              <Tooltip key={item.id} label={item.label} side="right">
                <button
                  type="button"
                  onClick={() => {
                    if (rail === item.id) setRailOpen((v) => !v)
                    else {
                      setRail(item.id)
                      setRailOpen(true)
                    }
                  }}
                  className={cn('inline-flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-2xl transition', active ? 'bg-brand-600 text-white shadow-soft' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900')}
                >
                  <Icon size={18} />
                  <span className="text-[8.5px] font-bold uppercase">{item.label.slice(0, 6)}</span>
                </button>
              </Tooltip>
            )
          })}
        </nav>

        {railOpen && (
          <aside className="z-20 flex w-[320px] shrink-0 flex-col border-e border-ink-200 bg-[var(--surface-2)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-white px-3.5 py-3">
              <h2 className="font-display text-[13.5px] font-extrabold text-ink-950">
                {rail === 'insert' && t(store.lang, 'sectionLibrary')}
                {rail === 'layers' && t(store.lang, 'layers')}
                {rail === 'pages' && t(store.lang, 'pages')}
                {rail === 'design' && t(store.lang, 'designSystem')}
                {rail === 'data' && t(store.lang, 'collections')}
                {rail === 'settings' && t(store.lang, 'settings')}
              </h2>
              <IconButton icon="ChevronLeft" label={t(store.lang, 'close')} size="sm" onClick={() => setRailOpen(false)} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {rail === 'insert' && (
                <>
                  {pendingIndex !== null && (
                    <div className="flex items-start gap-2.5 border-b border-brand-200 bg-brand-50 px-3.5 py-3">
                      <Ic n="CornerDownRight" size={15} className="mt-0.5 shrink-0 text-brand-600" />
                      <p className="flex-1 text-[11.5px] font-semibold leading-snug text-brand-800">
                        {t(store.lang, 'insertAtPosition').replace('{n}', String(pendingIndex + 1))}
                      </p>
                      <button type="button" onClick={() => setPendingIndex(null)} className="text-brand-600 hover:text-brand-800">
                        <Ic n="X" size={14} />
                      </button>
                    </div>
                  )}
                  <SectionLibrary lang={store.lang} onInsert={(type) => handleInsert(type, pendingIndex ?? undefined)} />
                </>
              )}
              {rail === 'layers' && (
                <LayersPanel
                  lang={store.lang}
                  blocks={blocksForLayers}
                  selectionId={store.selection?.blockId}
                  onSelect={(id) => store.selectBlock(id)}
                  onMove={(from, to) => store.moveBlock(from - 1, to - 1)}
                  onDuplicate={store.duplicateBlock}
                  onDelete={(id) => setConfirmDelete(id)}
                  onToggle={store.toggleBlockFlag}
                  onRename={store.setBlockLabel}
                />
              )}
              {rail === 'pages' && (
                <PagesPanel
                  site={site}
                  lang={store.lang}
                  activePageId={page.id}
                  onSelectPage={store.setActivePage}
                  onAddPage={store.addPage}
                  onUpdatePage={store.updatePage}
                  onDeletePage={store.deletePage}
                />
              )}
              {rail === 'design' && (
                <DesignPanel
                  site={site}
                  lang={store.lang}
                  onTheme={store.updateTheme}
                  onPreset={store.applyBrandPreset}
                  onLogo={(url) => store.updateSite(site.id, { logo: url })}
                  onAddMedia={store.addMedia}
                />
              )}
              {rail === 'data' && <DataPanel site={site} lang={store.lang} />}
              {rail === 'settings' && (
                <SettingsPanel
                  site={site}
                  lang={store.lang}
                  onSettings={store.updateSettings}
                  onAdmin={store.updateAdmin}
                  onAddMedia={store.addMedia}
                  onExport={() => downloadJson(`${site.slug}-site.json`, site)}
                  onImport={handleImport}
                  onReset={handleReset}
                />
              )}
            </div>
          </aside>
        )}

        {/* ---------- canvas ---------- */}
        <div className="min-w-0 flex-1">
          <Canvas
            site={site}
            lang={store.lang}
            device={store.device}
            selection={store.editMode ? store.selection : null}
            onSelect={store.select}
            onPropChange={store.updateBlockProp}
            onElementStyle={store.updateElementStyle}
            onNavigate={(to) => navigate(`/site/${site.slug}${to}`)}
            onAddMedia={store.addMedia}
            onInsertBlock={handleInsert}
            onDuplicateBlock={store.duplicateBlock}
            onDeleteBlock={(id) => setConfirmDelete(id)}
            onMoveBlock={(from, to) => store.moveBlock(from - 1, to - 1)}
            onToggleFlag={store.toggleBlockFlag}
            onOpenInspector={(tab) => {
              setInspectorTab(tab)
              setShowInspector(true)
            }}
            shell={
              <CanvasPage
                site={site}
                pageId={page.id}
                lang={store.lang}
                selection={store.editMode ? store.selection : null}
                onSelect={store.select}
                onPropChange={store.updateBlockProp}
                onElementStyle={store.updateElementStyle}
                onNavigate={(to) => navigate(`/site/${site.slug}${to}`)}
                onInsertBlock={handleInsert}
              />
            }
          />
        </div>

        {/* ---------- inspector ---------- */}
        {showInspector && (
          <aside className="z-20 hidden w-[340px] shrink-0 flex-col border-s border-ink-200 bg-white xl:flex">
            {selectedBlock ? (
              <Inspector
                block={selectedBlock}
                def={selectedDef}
                lang={store.lang}
                elementKey={store.selection?.elementKey ?? 'section'}
                media={site.media}
                onAddMedia={store.addMedia}
                tab={inspectorTab}
                onTab={setInspectorTab}
                onChangeProp={(path, value) => store.updateBlockProp(selectedBlock.id, path, value)}
                onChangeElement={store.updateElementStyle.bind(null, selectedBlock.id)}
                onResetElement={store.resetElementStyle.bind(null, selectedBlock.id)}
                onChangeStyle={(patch) => store.updateBlockStyle(selectedBlock.id, patch)}
              />
            ) : (
              <EmptyInspector lang={store.lang} onPick={() => setRail('insert')} />
            )}
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && store.removeBlock(confirmDelete)}
        title={t(store.lang, 'deleteSectionTitle')}
        message={t(store.lang, 'deleteSectionMessage')}
        confirmLabel={t(store.lang, 'deleteSection')}
      />
    </div>
  )
}

function ToolbarBtn({ icon, label, onClick, disabled }: { icon: string; label: string; onClick: () => void; disabled?: boolean }) {
  const Icon = resolveIcon(icon)
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-600 transition hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30"
      >
        <Icon size={17} />
      </button>
    </Tooltip>
  )
}

function EmptyInspector({ lang, onPick }: { lang: Lang; onPick: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Ic n='MousePointerClick' size={26} />
      </span>
      <div>
        <h3 className="font-display text-[15px] font-extrabold text-ink-950">{t(lang, 'nothingSelected')}</h3>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
          {t(lang, 'nothingSelectedHint')}
        </p>
      </div>
      <button type="button" className="btn-outline" onClick={onPick}>
        <Ic n='PlusCircle' size={15} />
        {t(lang, 'addASection')}
      </button>
      <div className="mt-2 w-full rounded-2xl border border-ink-200 bg-[var(--surface-2)] p-3 text-start">
        <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{t(lang, 'shortcuts')}</p>
        <ul className="flex flex-col gap-1.5 text-[11.5px] text-ink-600">
          {[
            ['⌘/Ctrl + Z', t(lang, 'scUndo')],
            ['⌘/Ctrl + ⇧ + Z', t(lang, 'scRedo')],
            ['Double-click', t(lang, 'scEditText')],
            ['Delete', t(lang, 'scDelete')],
            ['Esc', t(lang, 'scDeselect')],
          ].map(([k, v]) => (
            <li key={k} className="flex items-center justify-between gap-2">
              <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-ink-700 ring-1 ring-ink-200">{k}</code>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
