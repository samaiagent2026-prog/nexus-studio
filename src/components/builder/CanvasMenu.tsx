import React from 'react'
import { resolveIcon } from '../../lib/icons'
import { t } from '../../lib/i18n'
import type { Lang } from '../../lib/types'
import { cn } from '../../lib/utils'
import type { MenuTarget } from '../blocks/context'

/* ============================================================
   Canvas context menu. Opened by right-clicking a section, an
   element or a repeated item; the primary action is always
   delete, and every entry is reachable by keyboard.
   ============================================================ */

export interface MenuAction {
  id: string
  icon: string
  label: string
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
  /** Renders a divider above this entry. */
  divider?: boolean
  shortcut?: string
}

export function CanvasMenu({
  target,
  lang,
  actions,
  onClose,
}: {
  target: MenuTarget
  lang: Lang
  actions: MenuAction[]
  onClose: () => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ left: target.x, top: target.y })
  const [active, setActive] = React.useState(0)

  /* keep the menu inside the viewport, flipping near the edges */
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const pad = 8
    let left = target.x
    let top = target.y
    if (left + r.width + pad > window.innerWidth) left = Math.max(pad, window.innerWidth - r.width - pad)
    if (top + r.height + pad > window.innerHeight) top = Math.max(pad, target.y - r.height)
    setPos({ left, top })
  }, [target.x, target.y])

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('mousedown', onDown, true)
    document.addEventListener('contextmenu', onDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onClose)
    window.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      document.removeEventListener('contextmenu', onDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onClose)
      window.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  /* clamp keyboard focus to enabled entries */
  const enabled = React.useMemo(() => actions.map((a, i) => ({ a, i })).filter(({ a }) => !a.disabled), [actions])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!enabled.length) return
    const current = enabled.findIndex(({ i }) => i === active)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const dir = e.key === 'ArrowDown' ? 1 : -1
      const next = (current + dir + enabled.length) % enabled.length
      setActive(enabled[next].i)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const item = actions[active]
      if (item && !item.disabled) {
        item.onSelect()
        onClose()
      }
    }
  }

  return (
    <div
      ref={ref}
      role="menu"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => e.preventDefault()}
      style={{ left: pos.left, top: pos.top }}
      className="fixed z-[120] w-56 animate-scale-in overflow-hidden rounded-2xl border border-ink-200 bg-white/95 p-1.5 shadow-lift backdrop-blur-xl"
      autoFocus
    >
      {actions.map((a, i) => (
        <React.Fragment key={a.id}>
          {a.divider && i > 0 && <span className="my-1 block h-px bg-ink-100" />}
          <button
            type="button"
            role="menuitem"
            disabled={a.disabled}
            onMouseEnter={() => !a.disabled && setActive(i)}
            onClick={() => {
              if (a.disabled) return
              a.onSelect()
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start text-[13px] font-semibold transition',
              a.disabled
                ? 'cursor-not-allowed text-ink-300'
                : a.danger
                  ? 'text-rose-600 hover:bg-rose-50'
                  : active === i
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-700 hover:bg-ink-100',
            )}
          >
            <MenuIcon icon={a.icon} />
            <span className="flex-1 truncate">{a.label}</span>
            {a.shortcut && <span className="text-[10.5px] font-medium text-ink-400">{a.shortcut}</span>}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}

function MenuIcon({ icon }: { icon: string }) {
  const Icon = resolveIcon(icon)
  return <Icon size={15} className="shrink-0" />
}
