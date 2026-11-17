import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { Block, CollectionRecord, Device, Dir, ElementStyle, Lang, Selection, Site } from '../../lib/types'
import { clamp, cn, getPath, setPath, tr } from '../../lib/utils'
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
  // Explicit box size. `max-width` is lifted so a width wider than the parent's
  // natural cap still applies; images get `object-fit` so they do not distort.
  if (style.widthPx != null) {
    css.width = `${style.widthPx}px`
    css.maxWidth = 'none'
  }
  if (style.heightPx != null) css.height = `${style.heightPx}px`
  if (style.widthPx != null || style.heightPx != null) {
    css.flex = 'none'
    // Inline text (span, a) ignores width/height, so promote it to a block box
    // the moment the user gives it an explicit size.
    css.display = 'block'
  }
  // Relative offsets (not transforms) so they also work on inline elements.
  if (style.offsetX != null || style.offsetY != null) {
    css.position = 'relative'
    css.left = `${style.offsetX ?? 0}px`
    css.top = `${style.offsetY ?? 0}px`
  }
  if (style.scale != null && style.scale !== 1) css.transform = `scale(${style.scale})`
  return css
}

/* ---------------- inline editable element ---------------- */

type EditableTag = React.ElementType

/** Resize affordances. Edges set an explicit box size; the corner scales. */
type Side = 'left' | 'right' | 'top' | 'bottom' | 'corner'
const sides: Side[] = ['left', 'right', 'top', 'bottom', 'corner']
const MIN_SIZE = 16

// Handles sit just inside the element box: many blocks use `overflow-hidden`,
// which would clip anything placed outside the bounds.
const HANDLE_CLASS: Record<Side, string> = {
  left: 'top-1/2 start-0.5 h-3.5 w-2 -translate-y-1/2 cursor-ew-resize',
  right: 'top-1/2 end-0.5 h-3.5 w-2 -translate-y-1/2 cursor-ew-resize',
  top: 'start-1/2 top-0.5 h-2 w-3.5 -translate-x-1/2 cursor-ns-resize',
  bottom: 'start-1/2 bottom-0.5 h-2 w-3.5 -translate-x-1/2 cursor-ns-resize',
  corner: 'bottom-0.5 end-0.5 h-3.5 w-3.5 cursor-nwse-resize',
}

/**
 * Pointer-drag to move an element, plus a corner grip to resize it.
 * Offsets are written as `left`/`top` on a relatively positioned box (works for
 * inline elements too, unlike transform) and committed on release so a drag
 * stays a single undo step.
 */
export function useDirectManipulation({
  ref,
  k,
  enabled,
  selected,
}: {
  ref: React.RefObject<HTMLElement | null>
  k: string
  enabled: boolean
  selected: boolean
}) {
  const ctx = useBlockCtx()
  const overrides = ctx.block.elements?.[k]
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean; id: number; bounds?: { minX: number; maxX: number; minY: number; maxY: number } } | null>(null)
  const resize = useRef<{ side: Side; startW: number; startH: number; startScale: number; d0: number; fx: number; fy: number; nextW?: number; nextH?: number; nextScale?: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return
      // Nested draggables (an image inside a card) must not both track the pointer.
      e.stopPropagation()
      drag.current = { px: e.clientX, py: e.clientY, ox: overrides?.offsetX ?? 0, oy: overrides?.offsetY ?? 0, moved: false, id: e.pointerId }
    },
    [enabled, overrides?.offsetX, overrides?.offsetY],
  )

  /** Bounds that keep the element inside the canvas area the user can actually
      reach. Overlaying panels (narrow viewports) are subtracted so a handle can
      never end up hidden behind one. */
  const measureBounds = (el: HTMLElement, ox: number, oy: number) => {
    const frame = el.closest('[data-canvas-frame]') as HTMLElement | null
    if (!frame) return null
    const fr = frame.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    let left = fr.left
    let right = fr.right
    let top = fr.top
    let bottom = fr.bottom
    document.querySelectorAll('aside').forEach((a) => {
      if (getComputedStyle(a).position !== 'absolute') return
      const ar = a.getBoundingClientRect()
      if (ar.width === 0 || ar.bottom < top || ar.top > bottom) return
      // Panel on the right edge: pull the reachable right edge in.
      if (ar.left > left && ar.left < right && ar.width < (right - left) * 0.6) right = Math.min(right, ar.left)
      else if (ar.right > left && ar.right < right && ar.width < (right - left) * 0.6) left = Math.max(left, ar.right)
    })
    return {
      minX: Math.min(left - (r.left - ox), 0),
      maxX: Math.max(right - (r.right - ox), 0),
      minY: Math.min(top - (r.top - oy), 0),
      maxY: Math.max(bottom - (r.bottom - oy), 0),
    }
  }

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      const dx = e.clientX - d.px
      const dy = e.clientY - d.py
      // Small threshold so a plain click still selects instead of nudging.
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return
      const el = ref.current
      if (!d.moved) {
        d.moved = true
        setDragging(true)
        ctx.select(ctx.block.id, k)
        const b = el ? measureBounds(el, d.ox, d.oy) : null
        if (b) d.bounds = b
        try {
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        } catch {
          /* capture is best-effort */
        }
      }
      if (el) {
        const b = d.bounds
        const nx = b ? clamp(d.ox + dx, b.minX, b.maxX) : d.ox + dx
        const ny = b ? clamp(d.oy + dy, b.minY, b.maxY) : d.oy + dy
        el.style.position = 'relative'
        el.style.left = `${Math.round(nx)}px`
        el.style.top = `${Math.round(ny)}px`
      }
    },
    [ctx, k, ref],
  )

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      drag.current = null
      if (!d?.moved) return
      setDragging(false)
      const el = ref.current
      if (el) {
        el.style.left = ''
        el.style.top = ''
        el.style.position = ''
      }
      const b = d.bounds
      const dx = e.clientX - d.px
      const dy = e.clientY - d.py
      const nx = b ? clamp(d.ox + dx, b.minX, b.maxX) : d.ox + dx
      const ny = b ? clamp(d.oy + dy, b.minY, b.maxY) : d.oy + dy
      ctx.updateElement(k, { offsetX: Math.round(nx), offsetY: Math.round(ny) })
      suppressFollowingClick()
    },
    [ctx, k, ref],
  )

  /** Swallow the `click` that browsers fire after a pointer gesture. Without
      this, releasing over a neighbouring element selects it and the grips for
      the element we just resized disappear. */
  const suppressFollowingClick = () => {
    const stop = (ev: MouseEvent) => {
      ev.stopPropagation()
      ev.preventDefault()
      window.removeEventListener('click', stop, true)
    }
    window.addEventListener('click', stop, true)
    window.setTimeout(() => window.removeEventListener('click', stop, true), 400)
  }

  const startResize = useCallback(
    (e: React.PointerEvent, side: Side) => {
      if (!enabled) return
      e.stopPropagation()
      e.preventDefault()
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const isCorner = side === 'corner'
      // Corner scales proportionally; edges set an explicit box size.
      const startW = r.width
      const startH = r.height
      const startScale = overrides?.scale ?? 1
      // Anchor the opposite edge so the element grows away from the pointer.
      const fx = ctx.dir === 'rtl' ? r.right : r.left
      const fy = r.top
      const d0 = Math.max(16, Math.hypot(e.clientX - fx, e.clientY - fy))
      const state = { side, startW, startH, startScale, d0, fx, fy, nextW: undefined as number | undefined, nextH: undefined as number | undefined, nextScale: undefined as number | undefined }
      resize.current = state
      ctx.select(ctx.block.id, k)

      const onMove = (ev: PointerEvent) => {
        if (isCorner) {
          const d1 = Math.hypot(ev.clientX - state.fx, ev.clientY - state.fy)
          state.nextScale = clamp(startScale * (d1 / d0), 0.25, 4)
          el.style.transform = `scale(${state.nextScale.toFixed(3)})`
          return
        }
        // Measure against the opposite edge, which stays put. Using real screen
        // coordinates keeps this correct in both LTR and RTL.
        if (side === 'right') {
          state.nextW = Math.max(MIN_SIZE, Math.round(ev.clientX - r.left))
          el.style.width = `${state.nextW}px`
          el.style.maxWidth = 'none'
        } else if (side === 'left') {
          state.nextW = Math.max(MIN_SIZE, Math.round(r.right - ev.clientX))
          el.style.width = `${state.nextW}px`
          el.style.maxWidth = 'none'
        } else if (side === 'bottom') {
          state.nextH = Math.max(MIN_SIZE, Math.round(ev.clientY - r.top))
          el.style.height = `${state.nextH}px`
        } else {
          state.nextH = Math.max(MIN_SIZE, Math.round(r.bottom - ev.clientY))
          el.style.height = `${state.nextH}px`
        }
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        resize.current = null
        el.style.transform = ''
        el.style.width = ''
        el.style.height = ''
        suppressFollowingClick()
        if (state.nextScale != null) ctx.updateElement(k, { scale: Math.round(state.nextScale * 100) / 100 })
        else if (state.nextW != null || state.nextH != null) {
          ctx.updateElement(k, {
            ...(state.nextW != null ? { widthPx: state.nextW } : {}),
            ...(state.nextH != null ? { heightPx: state.nextH } : {}),
          })
        }
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [enabled, ref, ctx, k, overrides?.scale],
  )

  const grip = enabled && selected ? (
      <>
        {sides.map((side) => (
          <span
            key={side}
            data-resize-grip
            data-side={side}
            role="button"
            aria-label={t(ctx.lang, 'resizeHandle')}
            title={t(ctx.lang, 'resizeHandle')}
            onPointerDown={(e) => startResize(e, side)}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className={cn('absolute z-40 rounded-full border-2 border-white bg-brand-600 shadow-lift', HANDLE_CLASS[side])}
          />
        ))}
      </>
    ) : null

  return { grip, dragging, dragHandlers: { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag } }
}

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
  // Text becomes editable on double-click, so a single press can drag it.
  const { grip, dragging, dragHandlers } = useDirectManipulation({ ref, k, enabled: editingMode && !editing, selected: isSelected })

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

  // Exported pages carry both languages on the node so the shipped runtime can
  // swap copy (and direction) without a server round-trip.
  const i18n = useMemo(() => {
    if (ctx.mode === 'edit' || !fieldPath) return null
    const raw = getPath(ctx.block.props, fieldPath)
    if (raw == null || typeof raw !== 'object') return null
    return { en: tr(raw, 'en'), ar: tr(raw, 'ar') }
  }, [ctx.mode, ctx.block.props, fieldPath])

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
        editingMode && affordance && 'cursor-grab rounded-[6px] outline-offset-[3px] active:cursor-grabbing',
        editingMode && affordance && !isSelected && 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-brand-400/70',
        isSelected && 'relative outline outline-2 outline-brand-500',
        editing && 'cursor-text outline outline-2 outline-brand-500 ring-4 ring-brand-500/15',
        dragging && 'cursor-grabbing opacity-90',
        editingMode && overrides?.hidden && 'opacity-35 saturate-0 outline outline-1 outline-dashed outline-ink-400',
        className,
      )}
      style={{ ...elementStyleToCss(overrides), ...style }}
      data-el={editingMode ? k : undefined}
      data-hidden={editingMode && overrides?.hidden ? 'true' : undefined}
      {...(i18n ? { 'data-nexus-i18n': '', 'data-en': i18n.en, 'data-ar': i18n.ar } : {})}
      {...(editingMode && !editing ? dragHandlers : {})}
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
      {grip}
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
  const ownRef = useRef<HTMLDivElement | null>(null)
  const { grip, dragging, dragHandlers } = useDirectManipulation({ ref: ownRef, k: key, enabled: editingMode, selected: isSelected })
  if (overrides?.hidden && !editingMode) return null
  return (
    <div
      {...rest}
      ref={ownRef}
      data-el={editingMode ? key : undefined}
      data-hidden={editingMode && overrides?.hidden ? 'true' : undefined}
      data-item-field={reorderable ? field : undefined}
      data-item-index={reorderable ? index : undefined}
      className={cn(
        'relative transition-[outline-color] duration-150',
        editingMode && 'cursor-grab rounded-xl outline-offset-[3px] active:cursor-grabbing',
        editingMode && !isSelected && 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-brand-400/60',
        isSelected && 'relative outline outline-2 outline-brand-500',
        dragging && 'cursor-grabbing opacity-90',
        editingMode && overrides?.hidden && 'opacity-35 saturate-0 outline outline-1 outline-dashed outline-ink-400',
        reorderable && 'group/item',
        className,
      )}
      style={elementStyleToCss(overrides)}
      {...(editingMode ? dragHandlers : {})}
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
      {grip}
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
