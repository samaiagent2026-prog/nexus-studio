import React from 'react'
import { resolveIcon, Ic } from '../../lib/icons'
import { blockLabel, displayBlockLabel } from '../../lib/blockCopy'
import { getBlockDef } from '../blocks/registry'
import { BlockRenderer } from '../blocks/BlockRenderer'
import type { Block, Device, Lang, MediaAsset, Selection, Site } from '../../lib/types'
import { cn, tr } from '../../lib/utils'
import { Tooltip } from '../ui'
import { t } from '../../lib/i18n'
import { FloatingToolbar } from './FloatingToolbar'
import { schemaCopy } from '../../lib/schemaCopy'

/* ============================================================
   Canvas: renders the live site inside a device frame, wires
   click-to-select and shows the floating element toolbar.
   ============================================================ */

const DEVICE_WIDTH: Record<Device, number> = { desktop: 0, tablet: 820, mobile: 414 }
const DEVICE_LABEL: Record<Device, { en: string; ar: string }> = {
  desktop: { en: 'Desktop · fluid', ar: 'سطح المكتب · مرن' },
  tablet: { en: 'Tablet · 820px', ar: 'لوحي · 820 بكسل' },
  mobile: { en: 'Mobile · 414px', ar: 'جوال · 414 بكسل' },
}

export interface CanvasProps {
  site: Site
  lang: Lang
  device: Device
  selection: Selection | null
  onSelect: (blockId: string, elementKey: string) => void
  onPropChange: (blockId: string, path: string, value: any) => void
  onElementStyle: (blockId: string, elementKey: string, patch: Record<string, any>) => void
  onNavigate: (to: string) => void
  onAddMedia: (assets: MediaAsset[]) => void
  onInsertBlock: (type: string, atIndex: number) => void
  onDuplicateBlock: (blockId: string) => void
  onDeleteBlock: (blockId: string) => void
  onMoveBlock: (from: number, to: number) => void
  onToggleFlag: (blockId: string, flag: 'hidden' | 'locked') => void
  onOpenInspector: (tab: 'content' | 'style' | 'advanced') => void
  /** Header/footer live outside the page flow. */
  shell?: React.ReactNode
}

export function Canvas(props: CanvasProps) {
  const { site, lang, device, selection, onSelect, onPropChange, onElementStyle, onNavigate, onAddMedia, onInsertBlock } = props
  const [frameRect, setFrameRect] = React.useState<{ top: number; left: number } | null>(null)
  const [elementRect, setElementRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null)
  const frameRef = React.useRef<HTMLDivElement>(null)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const width = DEVICE_WIDTH[device]

  /* measure the selected element so the toolbar can float above it */
  React.useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = () => {
      const fRect = frame.getBoundingClientRect()
      setFrameRect({ top: fRect.top, left: fRect.left })
      if (!selection) {
        setElementRect(null)
        return
      }
      const el = frame.querySelector<HTMLElement>(`[data-el="${cssEscape(selection.elementKey)}"]`)
      const sectionEl = frame.querySelector<HTMLElement>(`[data-block-id="${cssEscape(selection.blockId)}"]`)
      const target = el ?? sectionEl
      if (!target) {
        setElementRect(null)
        return
      }
      const r = target.getBoundingClientRect()
      setElementRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    measure()
    const raf = requestAnimationFrame(measure)
    const scroller = scrollRef.current
    window.addEventListener('resize', measure)
    scroller?.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      scroller?.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [selection, site, device, lang])

  const selectedBlock = React.useMemo(() => {
    if (!selection) return null
    if (site.header.id === selection.blockId) return site.header
    if (site.footer.id === selection.blockId) return site.footer
    for (const p of site.pages) {
      const hit = p.blocks.find((b) => b.id === selection.blockId)
      if (hit) return hit
    }
    return null
  }, [selection, site])

  /* "Edit text" from the floating toolbar starts inline editing on the
     selected element (or the first editable element inside the section). */
  const startInlineEdit = React.useCallback(() => {
    const frame = frameRef.current
    if (!frame || !selection) return
    const direct = frame.querySelector<HTMLElement>(`[data-el="${cssEscape(selection.elementKey)}"]`)
    const sectionEl = frame.querySelector<HTMLElement>(`[data-block-id="${cssEscape(selection.blockId)}"]`)
    const target =
      direct ??
      sectionEl?.querySelector<HTMLElement>('[data-el]') ??
      null
    if (!target) return
    target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }))
  }, [selection])

  const toolbarLabel = React.useMemo(() => {
    if (!selectedBlock || !selection) return ''
    if (selection.elementKey === 'section')
      return selectedBlock.label || blockLabel(getBlockDef(selectedBlock.type), lang) || selectedBlock.type
    const def = getBlockDef(selectedBlock.type)
    const found = def?.elements.find((e) => e.key === selection.elementKey)?.label
    return found ? schemaCopy(found, lang) : selection.elementKey
  }, [selectedBlock, selection, lang])

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--surface-2)]">
      {/* device chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-white/70 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-950 px-2.5 py-1 text-[11px] font-bold text-white">
            <Ic n={device === 'mobile' ? 'Smartphone' : device === 'tablet' ? 'Tablet' : 'Monitor'} size={12} />
            {tr(DEVICE_LABEL[device], lang)}
          </span>
          <span className="hidden text-[11.5px] font-medium text-ink-500 sm:inline">
            {tr(site.pages.find((p) => p.blocks.some((b) => b.id === selection?.blockId))?.name ?? { en: 'Home', ar: 'الرئيسية' }, lang)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-400">
          <span className="inline-flex items-center gap-1"><Ic n='MousePointerClick' size={12} />{t(lang, 'clickToEdit')}</span>
          <span className="hidden items-center gap-1 sm:inline-flex"><Ic n='TextCursorInput' size={12} />{t(lang, 'doubleClickText')}</span>
        </div>
      </div>

      {/* frame */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
        <div className="flex justify-center">
          <div
            ref={frameRef}
            className={cn(
              'relative w-full bg-white shadow-lift transition-[max-width] duration-300',
              device === 'desktop' ? 'rounded-2xl border border-ink-200/70' : 'rounded-[28px] border-[6px] border-ink-900',
            )}
            style={{ maxWidth: width ? `${width}px` : '100%' }}
            data-canvas-frame
          >
            <div
              className={cn('overflow-hidden', device === 'desktop' ? 'rounded-2xl' : 'rounded-[22px]')}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              data-site-theme={site.theme.mode}
            >
              {props.shell}
            </div>

            <FloatingToolbar
              elementKey={selection?.elementKey ?? 'section'}
              lang={lang}
              label={toolbarLabel}
              rect={elementRect}
              containerRect={frameRect}
              hidden={selectedBlock?.hidden}
              locked={selectedBlock?.locked}
              onQuickEdit={startInlineEdit}
              onDuplicate={() => selection && props.onDuplicateBlock(selection.blockId)}
              onDelete={() => selection && props.onDeleteBlock(selection.blockId)}
              onMove={(dir) => {
                if (!selection) return
                const index = site.pages.flatMap((p) => p.blocks).findIndex((b) => b.id === selection.blockId)
                if (index >= 0) props.onMoveBlock(index, index + dir)
              }}
              onHide={() => selection && props.onToggleFlag(selection.blockId, 'hidden')}
              onLock={() => selection && props.onToggleFlag(selection.blockId, 'locked')}
              onOpenStyle={() => props.onOpenInspector('style')}
              onOpenContent={() => props.onOpenInspector('content')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Renders the page body blocks plus header/footer, with insert affordances. */
export function CanvasPage({
  site,
  pageId,
  lang,
  selection,
  onSelect,
  onPropChange,
  onElementStyle,
  onNavigate,
  onInsertBlock,
}: {
  site: Site
  pageId: string
  lang: Lang
  selection: Selection | null
  onSelect: (blockId: string, elementKey: string) => void
  onPropChange: (blockId: string, path: string, value: any) => void
  onElementStyle: (blockId: string, elementKey: string, patch: Record<string, any>) => void
  onNavigate: (to: string) => void
  onInsertBlock: (type: string, atIndex: number) => void
}) {
  const page = site.pages.find((p) => p.id === pageId) ?? site.pages[0]
  const blocks = page?.blocks ?? []

  const renderBlock = (block: Block) => (
    <SectionShell
      key={block.id}
      block={block}
      selected={selection?.blockId === block.id}
      locked={block.locked}
      hidden={block.hidden}
      lang={lang}
      onSelect={() => onSelect(block.id, 'section')}
    >
      <BlockRenderer
        site={site}
        block={block}
        lang={lang}
        mode="edit"
        selection={selection}
        onSelect={onSelect}
        onPropChange={(path, value) => onPropChange(block.id, path, value)}
        onElementStyle={(elementKey, patch) => onElementStyle(block.id, elementKey, patch)}
        onNavigate={onNavigate}
      />
    </SectionShell>
  )

  return (
    <div className="relative min-h-full bg-white">
      <BlockRenderer
        site={site}
        block={site.header}
        lang={lang}
        mode="edit"
        selection={selection}
        onSelect={onSelect}
        onPropChange={(path, value) => onPropChange(site.header.id, path, value)}
        onElementStyle={(elementKey, patch) => onElementStyle(site.header.id, elementKey, patch)}
        onNavigate={onNavigate}
      />

      <main>
        {blocks.map((block, i) => (
          <React.Fragment key={block.id}>
            <InsertGap onAdd={() => onInsertBlock('__choose__', i)} index={i} lang={lang} />
            {renderBlock(block)}
          </React.Fragment>
        ))}
        <InsertGap onAdd={() => onInsertBlock('__choose__', blocks.length)} index={blocks.length} lang={lang} last />
      </main>

      <BlockRenderer
        site={site}
        block={site.footer}
        lang={lang}
        mode="edit"
        selection={selection}
        onSelect={onSelect}
        onPropChange={(path, value) => onPropChange(site.footer.id, path, value)}
        onElementStyle={(elementKey, patch) => onElementStyle(site.footer.id, elementKey, patch)}
        onNavigate={onNavigate}
      />
    </div>
  )
}

function SectionShell({
  block,
  selected,
  hidden,
  locked,
  lang,
  onSelect,
  children,
}: {
  block: Block
  selected: boolean
  hidden?: boolean
  locked?: boolean
  lang: Lang
  onSelect: () => void
  children: React.ReactNode
}) {
  const def = getBlockDef(block.type)
  const [hover, setHover] = React.useState(false)

  return (
    <div
      className={cn('section-wrap group/section relative', selected && 'is-selected')}
      data-block-id={block.id}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={cn(
          'relative transition-all',
          (hover || selected) && !locked && 'outline outline-1 outline-dashed outline-brand-400/60',
          selected && 'outline-2 outline-brand-500',
          hidden && 'opacity-40 saturate-0',
          locked && 'cursor-not-allowed',
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <div className={cn(locked && 'pointer-events-none')}>{children}</div>

        {/* section label chip */}
        {(hover || selected) && (
          <div className="pointer-events-none absolute start-3 top-3 z-30 flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-bold shadow-soft',
                selected ? 'bg-brand-600 text-white' : 'bg-ink-950/85 text-white',
              )}
            >
              <Ic n={def?.icon ?? 'Square'} size={11} />
              {displayBlockLabel(block, def, lang)}
            </span>
            {hidden && <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-[10.5px] font-bold text-white"><Ic n='EyeOff' size={11} />{t(lang, 'hiddenLabel')}</span>}
            {locked && <span className="inline-flex items-center gap-1 rounded-lg bg-ink-950 px-2 py-1 text-[10.5px] font-bold text-white"><Ic n='Lock' size={11} />{t(lang, 'blocked')}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function InsertGap({ onAdd, index, lang, last }: { onAdd: () => void; index: number; lang: Lang; last?: boolean }) {
  return (
    <div className="group/gap relative z-20 h-0">
      <div className="absolute inset-x-0 -top-3 flex h-6 items-center justify-center opacity-0 transition-opacity duration-200 group-hover/gap:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-[11px] font-bold text-white shadow-lift transition hover:scale-105"
        >
          <Ic n='Plus' size={12} />
          {t(lang, 'insertHere')}
        </button>
      </div>
    </div>
  )
}

const cssEscape = (value: string) => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(value)
  return value.replace(/["\\]/g, '\\$&')
}
