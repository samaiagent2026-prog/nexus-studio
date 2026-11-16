import React from 'react'
import { resolveIcon, Ic } from '../../lib/icons'
import { blockLabel, displayBlockLabel } from '../../lib/blockCopy'
import { getBlockDef } from '../blocks/registry'
import { BlockRenderer } from '../blocks/BlockRenderer'
import { CanvasBridgeProvider, useCanvasBridge, type MenuTarget } from '../blocks/context'
import type { Block, Device, Lang, MediaAsset, Selection, Site } from '../../lib/types'
import { cn, tr } from '../../lib/utils'
import { Tooltip } from '../ui'
import { t } from '../../lib/i18n'
import { FloatingToolbar } from './FloatingToolbar'
import { CanvasMenu, type MenuAction } from './CanvasMenu'
import { schemaCopy } from '../../lib/schemaCopy'

/* ============================================================
   Canvas: renders the live site inside a device frame, wires
   click-to-select, drag-to-reorder and the floating element
   toolbar / right-click context menu.
   ============================================================ */

const DEVICE_WIDTH: Record<Device, number> = { desktop: 0, tablet: 820, mobile: 414 }
const DEVICE_LABEL: Record<Device, { en: string; ar: string }> = {
  desktop: { en: 'Desktop · fluid', ar: 'سطح المكتب · مرن' },
  tablet: { en: 'Tablet · 820px', ar: 'لوحي · 820 بكسل' },
  mobile: { en: 'Mobile · 414px', ar: 'جوال · 414 بكسل' },
}

const BLOCK_MIME = 'application/x-nexus-block'
const ITEM_MIME = 'application/x-nexus-item'

/** Where a dragged block would land: before or after a page section. */
export interface DropTarget { index: number; edge: 'before' | 'after' }

export interface CanvasProps {
  site: Site
  lang: Lang
  device: Device
  selection: Selection | null
  onSelect: (blockId: string, elementKey: string) => void
  onPropChange: (blockId: string, path: string, value: any) => void
  onElementStyle: (blockId: string, elementKey: string, patch: Record<string, any>) => void
  onResetElementStyle: (blockId: string, elementKey: string) => void
  onNavigate: (to: string) => void
  onAddMedia: (assets: MediaAsset[]) => void
  onInsertBlock: (type: string, atIndex: number) => void
  onDuplicateBlock: (blockId: string) => void
  onDeleteBlock: (blockId: string) => void
  onToggleFlag: (blockId: string, flag: 'hidden' | 'locked') => void
  /** Reorder page blocks using 0-based page indices. */
  onReorderBlock: (from: number, to: number) => void
  onMoveItem: (blockId: string, field: string, from: number, to: number) => void
  onRemoveItem: (blockId: string, field: string, index: number) => void
  onDuplicateItem: (blockId: string, field: string, index: number) => void
  onOpenInspector: (tab: 'content' | 'style' | 'advanced') => void
  /** Header/footer live outside the page flow. */
  shell?: React.ReactNode
}

export function Canvas(props: CanvasProps) {
  const { site, lang, device, selection, onPropChange, onElementStyle, onNavigate } = props
  const [frameRect, setFrameRect] = React.useState<{ top: number; left: number } | null>(null)
  const [elementRect, setElementRect] = React.useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [menuTarget, setMenuTarget] = React.useState<MenuTarget | null>(null)
  const [draggingBlockId, setDraggingBlockId] = React.useState<string | null>(null)
  const [dropTarget, setDropTarget] = React.useState<DropTarget | null>(null)
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
      const el = frame.querySelector<HTMLElement>(
        `[data-block-id="${cssEscape(selection.blockId)}"] [data-el="${cssEscape(selection.elementKey)}"]`,
      ) ?? frame.querySelector<HTMLElement>(`[data-el="${cssEscape(selection.elementKey)}"]`)
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

  /** Locate a page block by id, returning its owning page index. */
  const blockAt = React.useCallback(
    (blockId: string): { block: Block; index: number } | null => {
      for (const p of site.pages) {
        const index = p.blocks.findIndex((b) => b.id === blockId)
        if (index >= 0) return { block: p.blocks[index], index }
      }
      return null
    },
    [site],
  )

  const pageCount = React.useMemo(
    () => site.pages.find((p) => p.blocks.some((b) => b.id === selection?.blockId))?.blocks.length ?? site.pages[0]?.blocks.length ?? 0,
    [site, selection],
  )

  /* "Edit text" starts inline editing on the selected element (or the first
     editable element inside the section). */
  const startInlineEdit = React.useCallback(
    (elementKey?: string) => {
      const frame = frameRef.current
      if (!frame || !selection) return
      const key = elementKey ?? selection.elementKey
      const direct = frame.querySelector<HTMLElement>(`[data-el="${cssEscape(key)}"]`)
      const sectionEl = frame.querySelector<HTMLElement>(`[data-block-id="${cssEscape(selection.blockId)}"]`)
      const target = direct ?? sectionEl?.querySelector<HTMLElement>('[data-el]') ?? null
      if (!target) return
      target.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }))
    },
    [selection],
  )

  const toolbarLabel = React.useMemo(() => {
    if (!selectedBlock || !selection) return ''
    if (selection.elementKey === 'section')
      return selectedBlock.label || blockLabel(getBlockDef(selectedBlock.type), lang) || selectedBlock.type
    const def = getBlockDef(selectedBlock.type)
    const found = def?.elements.find((e) => e.key === selection.elementKey)?.label
    return found ? schemaCopy(found, lang) : selection.elementKey
  }, [selectedBlock, selection, lang])

  /* ---------------- context menu ---------------- */

  const menuActions = React.useMemo<MenuAction[]>(() => {
    if (!menuTarget) return []
    const { blockId, elementKey, kind, field, index, count: countHint, owner } = menuTarget
    const hit = blockAt(blockId)
    const block = hit?.block
    const isShellBlock = site.header.id === blockId || site.footer.id === blockId

    if (kind === 'item' && field != null && index != null) {
      const list = block?.props?.[field]
      const count = countHint ?? (Array.isArray(list) ? list.length : 0)
      return [
        { id: 'edit', icon: 'Type', label: t(lang, 'editText'), onSelect: () => startInlineEdit(elementKey) },
        { id: 'up', icon: 'ArrowUp', label: t(lang, 'moveUp'), divider: true, disabled: index <= 0, onSelect: () => props.onMoveItem(blockId, field, index, index - 1) },
        { id: 'down', icon: 'ArrowDown', label: t(lang, 'moveDown'), disabled: index >= count - 1, onSelect: () => props.onMoveItem(blockId, field, index, index + 1) },
        { id: 'dup', icon: 'Copy', label: t(lang, 'duplicateItem'), onSelect: () => props.onDuplicateItem(blockId, field, index) },
        { id: 'del', icon: 'Trash2', label: t(lang, 'deleteItem'), danger: true, divider: true, disabled: count <= 1, onSelect: () => props.onRemoveItem(blockId, field, index) },
      ]
    }

    if (kind === 'element') {
      const hidden = !!block?.elements?.[elementKey]?.hidden
      const base: MenuAction[] = [
        { id: 'edit', icon: 'Type', label: t(lang, 'editText'), onSelect: () => startInlineEdit(elementKey) },
        { id: 'style', icon: 'Palette', label: t(lang, 'styleTab'), onSelect: () => props.onOpenInspector('style') },
        { id: 'content', icon: 'SlidersHorizontal', label: t(lang, 'settings'), onSelect: () => props.onOpenInspector('content') },
        { id: 'reset', icon: 'RotateCcw', label: t(lang, 'resetStyles'), divider: true, onSelect: () => props.onResetElementStyle(blockId, elementKey) },
        // A block's markup element cannot be un-rendered, so delete removes it
        // visually (and reversibly) while Show brings it back.
        hidden
          ? { id: 'show', icon: 'Eye', label: t(lang, 'showElement'), divider: true, onSelect: () => onElementStyle(blockId, elementKey, { hidden: false }) }
          : { id: 'del', icon: 'Trash2', label: t(lang, 'deleteElement'), danger: true, divider: true, onSelect: () => onElementStyle(blockId, elementKey, { hidden: true }) },
      ]
      // Element nested inside a repeatable item: also expose the card actions.
      if (owner) {
        const ownerList = block?.props?.[owner.field]
        const ownerCount = Array.isArray(ownerList) ? ownerList.length : 0
        base.push(
          { id: 'item-up', icon: 'ArrowUp', label: t(lang, 'moveUp'), divider: true, disabled: owner.index <= 0, onSelect: () => props.onMoveItem(blockId, owner.field, owner.index, owner.index - 1) },
          { id: 'item-down', icon: 'ArrowDown', label: t(lang, 'moveDown'), disabled: ownerCount > 0 && owner.index >= ownerCount - 1, onSelect: () => props.onMoveItem(blockId, owner.field, owner.index, owner.index + 1) },
          { id: 'item-dup', icon: 'Copy', label: t(lang, 'duplicateItem'), onSelect: () => props.onDuplicateItem(blockId, owner.field, owner.index) },
          { id: 'item-del', icon: 'Trash2', label: t(lang, 'deleteItem'), danger: true, onSelect: () => props.onRemoveItem(blockId, owner.field, owner.index) },
        )
      }
      return base
    }

    /* whole section */
    const index0 = hit?.index ?? 0
    return [
      { id: 'edit', icon: 'Type', label: t(lang, 'editText'), onSelect: () => startInlineEdit() },
      { id: 'style', icon: 'Palette', label: t(lang, 'styleTab'), onSelect: () => props.onOpenInspector('style') },
      { id: 'content', icon: 'SlidersHorizontal', label: t(lang, 'settings'), onSelect: () => props.onOpenInspector('content') },
      { id: 'up', icon: 'ArrowUp', label: t(lang, 'moveUp'), divider: true, disabled: isShellBlock || index0 <= 0, onSelect: () => props.onReorderBlock(index0, index0 - 1) },
      { id: 'down', icon: 'ArrowDown', label: t(lang, 'moveDown'), disabled: isShellBlock || index0 >= pageCount - 1, onSelect: () => props.onReorderBlock(index0, index0 + 1) },
      { id: 'dup', icon: 'Copy', label: t(lang, 'duplicateBlock'), disabled: isShellBlock, onSelect: () => props.onDuplicateBlock(blockId) },
      block?.hidden
        ? { id: 'show', icon: 'Eye', label: t(lang, 'showBlock'), onSelect: () => props.onToggleFlag(blockId, 'hidden') }
        : { id: 'hide', icon: 'EyeOff', label: t(lang, 'hideBlock'), onSelect: () => props.onToggleFlag(blockId, 'hidden') },
      block?.locked
        ? { id: 'unlock', icon: 'Unlock', label: t(lang, 'unlockBlock'), onSelect: () => props.onToggleFlag(blockId, 'locked') }
        : { id: 'lock', icon: 'Lock', label: t(lang, 'lockBlock'), onSelect: () => props.onToggleFlag(blockId, 'locked') },
      { id: 'del', icon: 'Trash2', label: t(lang, 'deleteSection'), danger: true, divider: true, disabled: isShellBlock, onSelect: () => props.onDeleteBlock(blockId) },
    ]
  }, [menuTarget, blockAt, lang, pageCount, props, site.header.id, site.footer.id, onElementStyle, startInlineEdit])

  /* ---------------- drag & drop ---------------- */

  const clearItemHighlight = () => {
    frameRef.current?.querySelectorAll('[data-item-field]').forEach((el) => el.classList.remove('ring-2', 'ring-brand-400'))
  }

  const handleDragOver = (e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types)
    if (types.includes(BLOCK_MIME)) {
      const section = (e.target as HTMLElement).closest<HTMLElement>('[data-page-index]')
      if (!section) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const index = Number(section.dataset.pageIndex)
      const r = section.getBoundingClientRect()
      const edge: 'before' | 'after' = e.clientY < r.top + r.height / 2 ? 'before' : 'after'
      setDropTarget((prev) => (prev && prev.index === index && prev.edge === edge ? prev : { index, edge }))
    } else if (types.includes(ITEM_MIME)) {
      const item = (e.target as HTMLElement).closest<HTMLElement>('[data-item-field]')
      if (!item) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      item.classList.add('ring-2', 'ring-brand-400')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    clearItemHighlight()
    setDropTarget(null)
    const blockId = e.dataTransfer.getData(BLOCK_MIME)
    if (blockId) {
      e.preventDefault()
      const hit = blockAt(blockId)
      const section = (e.target as HTMLElement).closest<HTMLElement>('[data-page-index]')
      if (!hit || !section) return
      const target = Number(section.dataset.pageIndex)
      const r = section.getBoundingClientRect()
      const edge: 'before' | 'after' = e.clientY < r.top + r.height / 2 ? 'before' : 'after'
      // Account for the dragged block's own slot when it sits before the target.
      let to = edge === 'before' ? target : target + 1
      if (hit.index < to) to -= 1
      if (to !== hit.index) props.onReorderBlock(hit.index, to)
      return
    }
    const rawItem = e.dataTransfer.getData(ITEM_MIME)
    if (rawItem) {
      e.preventDefault()
      try {
        const { field, index, blockId: itemBlockId } = JSON.parse(rawItem) as { field: string; index: number; blockId: string }
        const item = (e.target as HTMLElement).closest<HTMLElement>('[data-item-field]')
        if (!item || item.dataset.itemField !== field) return
        const to = Number(item.dataset.itemIndex)
        if (to !== index) props.onMoveItem(itemBlockId, field, index, to)
      } catch {
        /* malformed payload — ignore */
      }
    }
  }

  const handleDragEnd = () => {
    clearItemHighlight()
    setDraggingBlockId(null)
    setDropTarget(null)
  }

  const bridge = React.useMemo(
    () => ({
      requestMenu: setMenuTarget,
      draggingBlockId,
      dropTarget,
      beginBlockDrag: setDraggingBlockId,
      endBlockDrag: handleDragEnd,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draggingBlockId, dropTarget],
  )

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
          <span className="hidden items-center gap-1 lg:inline-flex"><Ic n='Trash2' size={12} />{t(lang, 'rightClickHint')}</span>
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
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={(e) => {
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDropTarget(null)
            }}
          >
            <div
              className={cn('overflow-hidden', device === 'desktop' ? 'rounded-2xl' : 'rounded-[22px]')}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              data-site-theme={site.theme.mode}
            >
              <CanvasBridgeProvider value={bridge}>{props.shell}</CanvasBridgeProvider>
            </div>

            <FloatingToolbar
              elementKey={selection?.elementKey ?? 'section'}
              lang={lang}
              label={toolbarLabel}
              rect={elementRect}
              containerRect={frameRect}
              hidden={selectedBlock?.hidden}
              locked={selectedBlock?.locked}
              onQuickEdit={() => startInlineEdit()}
              onDuplicate={() => selection && props.onDuplicateBlock(selection.blockId)}
              onDelete={() => selection && props.onDeleteBlock(selection.blockId)}
              onMove={(dir) => {
                if (!selection) return
                const hit = blockAt(selection.blockId)
                if (hit) props.onReorderBlock(hit.index, hit.index + dir)
              }}
              onHide={() => selection && props.onToggleFlag(selection.blockId, 'hidden')}
              onLock={() => selection && props.onToggleFlag(selection.blockId, 'locked')}
              onOpenStyle={() => props.onOpenInspector('style')}
              onOpenContent={() => props.onOpenInspector('content')}
            />
          </div>
        </div>
      </div>

      {menuTarget && (
        <CanvasMenu target={menuTarget} lang={lang} actions={menuActions} onClose={() => setMenuTarget(null)} />
      )}
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
  const bridge = useCanvasBridge()

  const renderBlock = (block: Block, index: number) => (
    <SectionShell
      key={block.id}
      block={block}
      index={index}
      selected={selection?.blockId === block.id}
      locked={block.locked}
      hidden={block.hidden}
      lang={lang}
      dragging={bridge?.draggingBlockId === block.id}
      dropEdge={bridge?.dropTarget?.index === index ? bridge.dropTarget.edge : null}
      onSelect={() => onSelect(block.id, 'section')}
      onDragHandleStart={() => bridge?.beginBlockDrag(block.id)}
      onDragHandleEnd={() => bridge?.endBlockDrag()}
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
            {renderBlock(block, i)}
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
  index,
  selected,
  hidden,
  locked,
  lang,
  dragging,
  dropEdge,
  onSelect,
  onDragHandleStart,
  onDragHandleEnd,
  children,
}: {
  block: Block
  index: number
  selected: boolean
  hidden?: boolean
  locked?: boolean
  lang: Lang
  dragging?: boolean
  dropEdge?: 'before' | 'after' | null
  onSelect: () => void
  onDragHandleStart: () => void
  onDragHandleEnd: () => void
  children: React.ReactNode
}) {
  const def = getBlockDef(block.type)
  const bridge = useCanvasBridge()
  const [hover, setHover] = React.useState(false)

  const openSectionMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    bridge?.requestMenu({ x: e.clientX, y: e.clientY, blockId: block.id, elementKey: 'section', kind: 'block' })
  }

  return (
    <div
      className={cn('section-wrap group/section relative', selected && 'is-selected', dragging && 'opacity-40')}
      data-block-id={block.id}
      data-page-index={index}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {dropEdge && (
        <span
          className={cn(
            'pointer-events-none absolute inset-x-0 z-40 h-1 rounded-full bg-brand-500 shadow-[0_0_0_3px_rgba(59,94,246,.22)]',
            dropEdge === 'before' ? '-top-0.5' : '-bottom-0.5',
          )}
        />
      )}
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
        onContextMenu={openSectionMenu}
      >
        <div className={cn(locked && 'pointer-events-none')}>{children}</div>

        {/* section label chip + drag handle */}
        {(hover || selected) && (
          <div className="absolute start-3 top-3 z-30 flex items-center gap-1.5">
            <span
              draggable
              onDragStart={(e) => {
                e.stopPropagation()
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData(BLOCK_MIME, block.id)
                onDragHandleStart()
              }}
              onDragEnd={onDragHandleEnd}
              title={t(lang, 'dragToReorder')}
              className="inline-flex h-6 cursor-grab items-center rounded-lg bg-ink-950/85 px-1.5 text-white shadow-soft active:cursor-grabbing"
            >
              <Ic n='GripVertical' size={12} />
            </span>
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
