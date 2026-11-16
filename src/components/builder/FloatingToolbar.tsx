import React from 'react'
import { resolveIcon } from '../../lib/icons'
import { t } from '../../lib/i18n'
import type { Lang } from '../../lib/types'
import { cn } from '../../lib/utils'
import { Tooltip } from '../ui'

/* ============================================================
   Floating toolbar that follows the selected element inside the
   canvas. This is what makes the editor feel like a design tool.
   ============================================================ */

export interface FloatingToolbarProps {
  /** Element key currently selected. */
  elementKey: string
  lang: Lang
  label: string
  rect: { top: number; left: number; width: number; height: number } | null
  containerRect: { top: number; left: number } | null
  onQuickEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
  onHide: () => void
  onLock: () => void
  hidden?: boolean
  locked?: boolean
  onOpenStyle: () => void
  onOpenContent: () => void
}

export function FloatingToolbar({
  elementKey,
  lang,
  label,
  rect,
  containerRect,
  onQuickEdit,
  onDuplicate,
  onDelete,
  onMove,
  onHide,
  onLock,
  hidden,
  locked,
  onOpenStyle,
  onOpenContent,
}: FloatingToolbarProps) {
  if (!rect || !containerRect) return null
  const isSection = elementKey === 'section'
  const top = Math.max(6, rect.top - containerRect.top - 46)
  const left = Math.max(6, rect.left - containerRect.left)

  return (
    <div
      className="pointer-events-auto absolute z-40 animate-scale-in"
      style={{ top, left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 rounded-2xl border border-ink-200 bg-white/95 p-1 shadow-lift backdrop-blur-xl">
        <span className="flex max-w-[190px] items-center gap-1.5 ps-2 pe-1">
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', isSection ? 'bg-ink-900' : 'bg-brand-500')} />
          <span className="truncate text-[11.5px] font-bold text-ink-800">{label}</span>
        </span>

        <span className="mx-0.5 h-5 w-px bg-ink-200" />

        <ToolbarBtn icon="Type" label={t(lang, 'editText')} onClick={onQuickEdit} />
        <ToolbarBtn icon="Palette" label={t(lang, 'styleTab')} onClick={onOpenStyle} />
        <ToolbarBtn icon="SlidersHorizontal" label={t(lang, 'settings')} onClick={onOpenContent} />

        {isSection && (
          <>
            <span className="mx-0.5 h-5 w-px bg-ink-200" />
            <ToolbarBtn icon="ChevronUp" label={t(lang, 'moveUp')} onClick={() => onMove(-1)} />
            <ToolbarBtn icon="ChevronDown" label={t(lang, 'moveDown')} onClick={() => onMove(1)} />
            <ToolbarBtn icon="Copy" label={t(lang, 'duplicateBlock')} onClick={onDuplicate} />
            <ToolbarBtn icon={hidden ? 'EyeOff' : 'Eye'} label={hidden ? t(lang, 'showBlock') : t(lang, 'hideBlock')} onClick={onHide} active={hidden} />
            <ToolbarBtn icon={locked ? 'Lock' : 'Unlock'} label={locked ? t(lang, 'unlockBlock') : t(lang, 'lockBlock')} onClick={onLock} active={locked} />
            <ToolbarBtn icon="Trash2" label={t(lang, 'deleteBlock')} onClick={onDelete} danger />
          </>
        )}
      </div>
    </div>
  )
}

function ToolbarBtn({ icon, label, onClick, danger, active }: { icon: string; label: string; onClick: () => void; danger?: boolean; active?: boolean }) {
  const Icon = resolveIcon(icon)
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-xl transition active:scale-90',
          active ? 'bg-brand-600 text-white' : danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
        )}
      >
        <Icon size={15} />
      </button>
    </Tooltip>
  )
}
