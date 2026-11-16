import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { Block, CollectionRecord, Device, Dir, Lang, Selection, Site } from '../../lib/types'
import { cn, getPath, setPath, tr } from '../../lib/utils'
import { t } from '../../lib/i18n'
import { Ic } from '../../lib/icons'

/* ============================================================
   Render context shared by every block renderer. In "edit" mode
   blocks become interactive: elements are selectable, text is
   inline-editable, and the floating toolbar appears.
   ============================================================ */

export type RenderMode = 'edit' | 'preview' | 'public'

/** What the canvas context menu was opened on. */
export interface MenuTarget {
  /** Viewport coordinates of the pointer. */
  x: number
  y: number
  blockId: string
  elementKey: string
  kind: 'block' | 'element' | 'item'
  /** Props array path + index, for `kind: 'item'`. */
  field?: string
  index?: number
  count?: number
  /**
   * When a nested element inside a repeatable item is right-clicked, the menu
   * also offers item-level actions against this owning item.
   */
  owner?: { field: string; index: number; count?: number }
}

export interface BlockRenderCtx {
  site: Site
  block: Block
  lang: Lang
  dir: Dir
  mode: RenderMode
  device: Device
  selection: Selection | null
  select: (blockId: string, elementKey: string) => void
  updateProp: (path: string, value: any) => void
  updateElement: (elementKey: string, patch: Record<string, any>) => void
  records: (collectionKey: string) => CollectionRecord[]
  /** Resolve an href for the current mode (edit mode keeps links inert). */
  href: (to: string) => string
  navigate: (to: string) => void
}

const Ctx = createContext<BlockRenderCtx | null>(null)

export const BlockCtxProvider = Ctx.Provider

/* ---------------- canvas bridge ----------------
   The menu and drag state live in the canvas (so it can float above the
   frame and knows about block ordering) while the triggers live deep inside
   block renderers. This context carries requests upward. */

export interface CanvasBridge {
  requestMenu: (target: MenuTarget) => void
  /** Block id currently being dragged, for the dimmed/ghost treatment. */
  draggingBlockId: string | null
  /** Page index a dragged block would land on, and which side of it. */
  dropTarget: { index: number; edge: 'before' | 'after' } | null
  beginBlockDrag: (blockId: string) => void
  endBlockDrag: () => void
}

const BridgeCtx = createContext<CanvasBridge | null>(null)

export const CanvasBridgeProvider = BridgeCtx.Provider

export const useCanvasBridge = () => useContext(BridgeCtx)

export function useBlockCtx(): BlockRenderCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBlockCtx must be used inside a block renderer')
  return ctx
}

/* ---------------- element style resolution ---------------- */

const SHADOWS: Record<string, string> = {
  none: 'none',
  soft: '0 1px 2px rgba(16,24,40,.04), 0 8px 24px -8px rgba(16,24,40,.10)',
  lift: '0 2px 4px rgba(16,24,40,.05), 0 18px 40px -12px rgba(16,24,40,.18)',
  glow: '0 18px 48px -14px var(--brand-500)',
}

export function elementStyleToCss(style?: Record<string, any>): React.CSSProperties {
  if (!style) return {}
  const css: React.CSSProperties = {}
  if (style.color) css.color = style.color
  if (style.bg) css.background = style.bg
  if (style.fontSize != null) css.fontSize = `${style.fontSize}px`
  if (style.fontWeight != null) css.fontWeight = style.fontWeight
  if (style.fontFamily) css.fontFamily = style.fontFamily
  if (style.lineHeight != null) css.lineHeight = style.lineHeight
  if (style.letterSpacing != null) css.letterSpacing = `${style.letterSpacing}px`
  if (style.textAlign) css.textAlign = style.textAlign
  if (style.italic) css.fontStyle = 'italic'
  if (style.underline) css.textDecoration = 'underline'
  if (style.uppercase) css.textTransform = 'uppercase'
  if (style.paddingX != null || style.paddingY != null)
    css.padding = `${style.paddingY ?? 0}px ${style.paddingX ?? 0}px`
  if (style.marginTop != null) css.marginTop = `${style.marginTop}px`
  if (style.marginBottom != null) css.marginBottom = `${style.marginBottom}px`
  if (style.radius != null) css.borderRadius = `${style.radius}px`
  if (style.borderWidth) css.border = `${style.borderWidth}px solid ${style.borderColor || 'currentColor'}`
  if (style.shadow) css.boxShadow = SHADOWS[style.shadow]
  if (style.opacity != null) css.opacity = style.opacity
  if (style.maxWidth != null) css.maxWidth = `${style.maxWidth}px`
  return css
}

/* ---------------- inline editable element ---------------- */

type EditableTag = React.ElementType

export interface EditableProps extends Record<string, any> {
  /** Stable element key, used for selection and style overrides. */
  k: string
  /** Props path backing this element's text (enables inline editing). */
  field?: string
  /** How to write inline edits: localized object vs plain string. */
  valueKind?: 'localized' | 'plain'
  as?: EditableTag
  /** Show a dashed affordance on hover in edit mode. */
  affordance?: boolean
  /**
   * Value shown instead of the block prop. Used when the content comes from a
   * CMS record — the element stays selectable and stylable but not inline
   * editable, because its text belongs to the collection, not the block.
   */
  fallback?: React.ReactNode
  children?: React.ReactNode
  innerRef?: React.Ref<any>
}

export function Editable({
  k,
  field,
  valueKind = 'localized',
  as = 'div',
  affordance = true,
  className,
  style,
  children,
  fallback,
  onClick,
  onDoubleClick,
  onContextMenu,
  innerRef,
  ...rest
}: EditableProps) {
  const ctx = useBlockCtx()
  const bridge = useCanvasBridge()
  const ref = useRef<HTMLElement | null>(null)
  const [editing, setEditing] = useState(false)
  const editingMode = ctx.mode === 'edit'
  // With a fallback (CMS-backed text) or explicit children, the visible value
  // does not come from block props, so inline editing is disabled.
  const fieldPath = fallback !== undefined || children !== undefined ? undefined : field
  const isSelected = ctx.selection?.blockId === ctx.block.id && ctx.selection?.elementKey === k
  const overrides = ctx.block.elements?.[k]
  const Tag: any = as

  const openMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!editingMode || !bridge) return
      e.preventDefault()
      e.stopPropagation()
      ctx.select(ctx.block.id, k)
      // If this element sits inside a repeatable item, offer item actions too.
      const ownerEl = (e.target as HTMLElement)?.closest?.('[data-item-field]') as HTMLElement | null
      const ownerField = ownerEl?.getAttribute('data-item-field') ?? undefined
      const ownerIndex = ownerEl?.getAttribute('data-item-index')
      bridge.requestMenu({
        x: e.clientX,
        y: e.clientY,
        blockId: ctx.block.id,
        elementKey: k,
        kind: 'element',
        owner:
          ownerField != null && ownerIndex != null
            ? { field: ownerField, index: Number(ownerIndex) }
            : undefined,
      })
    },
    [ctx, bridge, editingMode, k],
  )

  const startInlineEdit = useCallback(
    (e: React.MouseEvent) => {
      if (!editingMode || !fieldPath) return
      e.stopPropagation()
      e.preventDefault()
      const el = ref.current
      if (!el) return
      setEditing(true)
      el.setAttribute('contenteditable', 'true')
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    },
    [editingMode, fieldPath],
  )

  const commitInlineEdit = useCallback(() => {
    const el = ref.current
    if (!el || !fieldPath) return
    const text = el.innerText.replace(/\u00a0/g, ' ').replace(/\s+$/, '')
    el.removeAttribute('contenteditable')
    setEditing(false)
    const current = getPath(ctx.block.props, fieldPath)
    const next =
      valueKind === 'localized'
        ? { ...(typeof current === 'object' && current !== null ? current : {}), [ctx.lang]: text }
        : text
    const same = valueKind === 'localized' ? (current?.[ctx.lang] ?? '') === text : current === text
    if (!same) ctx.updateProp(fieldPath, next)
    else if (el.innerText !== text) el.innerText = text
  }, [ctx, fieldPath, valueKind])

  const text = useMemo(() => {
    if (!fieldPath) return undefined
    const resolved = tr(getPath(ctx.block.props, fieldPath), ctx.lang)
    return resolved
  }, [ctx.block.props, ctx.lang, fieldPath])

  // A hidden element disappears from the published site but stays reachable in
  // the editor so it can be restored from the context menu.
  if (overrides?.hidden && !editingMode) return null

  return (
    <Tag
      {...rest}
      ref={(node: HTMLElement) => {
        ref.current = node
        if (typeof innerRef === 'function') innerRef(node)
        else if (innerRef) (innerRef as any).current = node
      }}
      className={cn(
        'transition-[outline-color,box-shadow] duration-150',
        editingMode && affordance && 'cursor-pointer rounded-[6px] outline-offset-[3px]',
        editingMode && affordance && !isSelected && 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-brand-400/70',
        isSelected && 'outline outline-2 outline-brand-500',
        editing && 'cursor-text outline outline-2 outline-brand-500 ring-4 ring-brand-500/15',
        editingMode && overrides?.hidden && 'opacity-35 saturate-0 outline outline-1 outline-dashed outline-ink-400',
        className,
      )}
      style={{ ...elementStyleToCss(overrides), ...style }}
      data-el={editingMode ? k : undefined}
      data-hidden={editingMode && overrides?.hidden ? 'true' : undefined}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        if (editingMode && !editing) {
          e.stopPropagation()
          ctx.select(ctx.block.id, k)
        }
        onClick?.(e)
      }}
      onDoubleClick={(e: React.MouseEvent<HTMLElement>) => {
        startInlineEdit(e)
        onDoubleClick?.(e)
      }}
      onContextMenu={(e: React.MouseEvent<HTMLElement>) => {
        openMenu(e)
        onContextMenu?.(e)
      }}
      onBlur={commitInlineEdit}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (!editing) return
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).blur()
        }
      }}
      suppressContentEditableWarning
    >
      {text ? text : (fallback ?? children)}
    </Tag>
  )
}

/** Non-text element (image, icon, decorative box) that is still selectable in edit mode. */
export function Element({
  k,
  as = 'div',
  className,
  style,
  children,
  affordance = true,
  ...rest
}: EditableProps) {
  return (
    <Editable k={k} as={as} className={className} style={style} affordance={affordance} {...rest}>
      {children}
    </Editable>
  )
}

/** Wraps repeated items so each row can be selected and edited individually. */
export function EditableItem({
  k,
  index,
  className,
  children,
  onClick,
  field,
  ...rest
}: {
  k: string
  index: number
  className?: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  /** Props array path backing this item (enables reorder/remove via the menu). */
  field?: string
} & Record<string, any>) {
  const ctx = useBlockCtx()
  const bridge = useCanvasBridge()
  const key = `${k}.${index}`
  const isSelected = ctx.selection?.blockId === ctx.block.id && ctx.selection?.elementKey === key
  const editingMode = ctx.mode === 'edit'
  const reorderable = editingMode && field != null
  const overrides = ctx.block.elements?.[key]
  const listLength = field != null ? (getPath(ctx.block.props, field) as unknown[] | undefined)?.length : undefined
  if (overrides?.hidden && !editingMode) return null
  return (
    <div
      {...rest}
      data-el={editingMode ? key : undefined}
      data-hidden={editingMode && overrides?.hidden ? 'true' : undefined}
      data-item-field={reorderable ? field : undefined}
      data-item-index={reorderable ? index : undefined}
      className={cn(
        'relative transition-[outline-color] duration-150',
        editingMode && 'cursor-pointer rounded-xl outline-offset-[3px]',
        editingMode && !isSelected && 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-brand-400/60',
        isSelected && 'outline outline-2 outline-brand-500',
        editingMode && overrides?.hidden && 'opacity-35 saturate-0 outline outline-1 outline-dashed outline-ink-400',
        reorderable && 'group/item',
        className,
      )}
      style={elementStyleToCss(overrides)}
      onClick={(e) => {
        if (editingMode) {
          e.stopPropagation()
          ctx.select(ctx.block.id, key)
        }
        onClick?.(e)
      }}
      onContextMenu={(e) => {
        if (!editingMode || !bridge) return
        e.preventDefault()
        e.stopPropagation()
        ctx.select(ctx.block.id, key)
        bridge.requestMenu({
          x: e.clientX,
          y: e.clientY,
          blockId: ctx.block.id,
          elementKey: key,
          kind: field ? 'item' : 'element',
          field,
          index,
          count: listLength,
        })
      }}
    >
      {reorderable && <ItemDragHandle blockId={ctx.block.id} field={field} index={index} label={t(ctx.lang, 'dragToReorder')} />}
      {children}
    </div>
  )
}

/**
 * Grab handle for reordering the owning item list. The drag payload is read by
 * the canvas, which owns the store action and the drop target logic.
 */
function ItemDragHandle({ blockId, field, index, label }: { blockId: string; field: string; index: number; label: string }) {
  return (
    <span
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('application/x-nexus-item', JSON.stringify({ blockId, field, index }))
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title={label}
      aria-label={label}
      data-item-handle
      className="absolute -start-2 top-1/2 z-20 hidden h-6 w-6 -translate-y-1/2 cursor-grab items-center justify-center rounded-md bg-ink-950/85 text-white shadow-soft active:cursor-grabbing group-hover/item:flex"
    >
      <Ic n='GripVertical' size={12} />
    </span>
  )
}
