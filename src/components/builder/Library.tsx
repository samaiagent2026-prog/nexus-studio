import React from 'react'
import { resolveIcon, Ic } from '../../lib/icons'
import { CATEGORY_LABELS, type BlockCategory, type BlockDefinition } from '../../lib/schema'
import { blocksByCategory, SECTION_BLOCKS } from '../blocks/registry'
import type { Lang } from '../../lib/types'
import { cn, tr } from '../../lib/utils'
import { t } from '../../lib/i18n'
import { blockDescription, blockLabel, displayBlockLabel } from '../../lib/blockCopy'
import { Segmented, TextInput, Tooltip } from '../ui'

/* ============================================================
   Section library — drag or click to insert a block.
   ============================================================ */

export function SectionLibrary({
  lang,
  onInsert,
  compact,
}: {
  lang: Lang
  onInsert: (type: string) => void
  compact?: boolean
}) {
  const [query, setQuery] = React.useState('')
  const [category, setCategory] = React.useState<BlockCategory | 'all'>('all')
  const groups = React.useMemo(() => blocksByCategory(), [])

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = category === 'all' ? SECTION_BLOCKS : SECTION_BLOCKS.filter((b) => b.category === category)
    if (!q) return base
    return base.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        blockLabel(b, lang).includes(q) ||
        blockDescription(b, lang).includes(q) ||
        b.type.toLowerCase().includes(q),
    )
  }, [query, category, lang])

  const activeGroups = groups.filter((g) => g.blocks.some((b) => results.includes(b)))

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2.5 border-b border-[var(--border)] p-3.5">
        <TextInput value={query} onChange={setQuery} placeholder={t(lang, 'searchSections')} icon="Search" />
        <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={cn('shrink-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold transition', category === 'all' ? 'bg-ink-950 text-white' : 'text-ink-500 hover:bg-ink-100')}
          >
            {t(lang, 'all')}
          </button>
          {groups.map((g) => (
            <button
              key={g.category}
              type="button"
              onClick={() => setCategory(g.category)}
              className={cn('shrink-0 rounded-lg px-2.5 py-1.5 text-[11.5px] font-bold transition', category === g.category ? 'bg-ink-950 text-white' : 'text-ink-500 hover:bg-ink-100')}
            >
              {tr(CATEGORY_LABELS[g.category], lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5">
        {activeGroups.length === 0 && <p className="py-10 text-center text-[13px] text-ink-500">No sections match “{query}”.</p>}
        <div className="flex flex-col gap-5">
          {activeGroups.map((group) => (
            <section key={group.category}>
              <h4 className="mb-2.5 flex items-center justify-between text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">
                {tr(CATEGORY_LABELS[group.category], lang)}
                <span className="text-ink-300">{group.blocks.length}</span>
              </h4>
              <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1')}>
                {group.blocks
                  .filter((b) => results.includes(b))
                  .map((def) => (
                    <LibraryCard key={def.type} def={def} lang={lang} onInsert={onInsert} />
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function LibraryCard({ def, lang, onInsert }: { def: BlockDefinition; lang: Lang; onInsert: (type: string) => void }) {
  const Icon = resolveIcon(def.icon)
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-nexus-block', def.type)
        e.dataTransfer.effectAllowed = 'copy'
      }}
      onClick={() => onInsert(def.type)}
      className="group flex w-full items-start gap-3 rounded-2xl border border-ink-200 bg-white p-3 text-start transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift active:scale-[.99]"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-inset ring-brand-200/60 transition group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-white">
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-bold text-ink-900">{blockLabel(def, lang)}</span>
          <Ic n='PlusCircle' size={13} className="shrink-0 text-brand-500 opacity-0 transition group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-ink-500">{blockDescription(def, lang)}</span>
      </span>
    </button>
  )
}

/* ============================================================
   Layers panel — reorder, hide, lock, delete.
   ============================================================ */

export function LayersPanel({
  blocks,
  selectionId,
  onSelect,
  onMove,
  onDuplicate,
  onDelete,
  onToggle,
  onRename,
  lang,
}: {
  blocks: { id: string; type: string; label?: string; hidden?: boolean; locked?: boolean }[]
  selectionId?: string | null
  onSelect: (id: string) => void
  onMove: (from: number, to: number) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string, flag: 'hidden' | 'locked') => void
  onRename: (id: string, label: string) => void
  lang: Lang
}) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null)
  const [overIndex, setOverIndex] = React.useState<number | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  return (
    <div className="flex flex-col gap-1.5 p-3.5">
      {blocks.map((block, index) => {
        const def = defFor(block.type)
        const Icon = resolveIcon(def?.icon ?? 'Square')
        const active = selectionId === block.id
        return (
          <div
            key={block.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => {
              e.preventDefault()
              setOverIndex(index)
            }}
            onDrop={() => {
              if (dragIndex != null && dragIndex !== index) onMove(dragIndex, index)
              setDragIndex(null)
              setOverIndex(null)
            }}
            onDragEnd={() => {
              setDragIndex(null)
              setOverIndex(null)
            }}
            onClick={() => onSelect(block.id)}
            className={cn(
              'group flex cursor-pointer items-center gap-2 rounded-xl border p-2 transition-all',
              active ? 'border-brand-500 bg-brand-50/70 shadow-soft' : 'border-transparent bg-white hover:border-ink-200 hover:bg-ink-50',
              overIndex === index && dragIndex !== null && 'border-brand-400 ring-1 ring-brand-300',
            )}
          >
            <span className="cursor-grab text-ink-300 transition group-hover:text-ink-500">
              <Ic n='GripVertical' size={15} />
            </span>
            <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', active ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600')}>
              <Icon size={14} />
            </span>
            <span className="min-w-0 flex-1">
              {editingId === block.id ? (
                <input
                  autoFocus
                  defaultValue={displayBlockLabel(block, def, lang)}
                  onBlur={(e) => {
                    onRename(block.id, e.target.value)
                    setEditingId(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                  }}
                  className="w-full rounded-md border border-brand-300 bg-white px-1.5 py-0.5 text-[12px] font-semibold outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    setEditingId(block.id)
                  }}
                  className={cn('block truncate text-[12.5px] font-semibold', active ? 'text-brand-800' : 'text-ink-800', block.hidden && 'text-ink-400 line-through')}
                >
                  {displayBlockLabel(block, def, lang)}
                </span>
              )}
            </span>

            <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Tooltip label={t(lang, 'moveUp')}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onMove(index, index - 1) }} disabled={index === 0} className="rounded-md p-1 text-ink-500 transition hover:bg-ink-100 disabled:opacity-30">
                  <Ic n='ChevronUp' size={13} />
                </button>
              </Tooltip>
              <Tooltip label={t(lang, 'moveDown')}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onMove(index, index + 1) }} disabled={index === blocks.length - 1} className="rounded-md p-1 text-ink-500 transition hover:bg-ink-100 disabled:opacity-30">
                  <Ic n='ChevronDown' size={13} />
                </button>
              </Tooltip>
              <Tooltip label={block.hidden ? t(lang, 'showBlock') : t(lang, 'hideBlock')}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(block.id, 'hidden') }} className={cn('rounded-md p-1 transition hover:bg-ink-100', block.hidden ? 'text-amber-600' : 'text-ink-500')}>
                  <Ic n={block.hidden ? 'EyeOff' : 'Eye'} size={13} />
                </button>
              </Tooltip>
              <Tooltip label={block.locked ? t(lang, 'unlockBlock') : t(lang, 'lockBlock')}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onToggle(block.id, 'locked') }} className={cn('rounded-md p-1 transition hover:bg-ink-100', block.locked ? 'text-ink-900' : 'text-ink-500')}>
                  <Ic n={block.locked ? 'Lock' : 'Unlock'} size={13} />
                </button>
              </Tooltip>
              <Tooltip label={t(lang, 'duplicateBlock')}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(block.id) }} className="rounded-md p-1 text-ink-500 transition hover:bg-ink-100">
                  <Ic n='Copy' size={13} />
                </button>
              </Tooltip>
              <Tooltip label={t(lang, 'deleteBlock')}>
                <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(block.id) }} className="rounded-md p-1 text-rose-500 transition hover:bg-rose-50">
                  <Ic n='Trash2' size={13} />
                </button>
              </Tooltip>
            </span>

            {(block.hidden || block.locked) && (
              <span className="flex shrink-0 items-center gap-1 group-hover:hidden">
                {block.hidden && <Ic n='EyeOff' size={12} className="text-amber-500" />}
                {block.locked && <Ic n='Lock' size={12} className="text-ink-500" />}
              </span>
            )}
          </div>
        )
      })}
      {blocks.length === 0 && <p className="py-8 text-center text-[12.5px] text-ink-500">{t(lang, 'noSectionsOnPage')}</p>}
    </div>
  )
}

function defFor(type: string) {
  // Local import avoids a circular dependency at module scope.
  return SECTION_BLOCKS.find((b) => b.type === type) ?? { icon: 'Square', label: type } as any
}
