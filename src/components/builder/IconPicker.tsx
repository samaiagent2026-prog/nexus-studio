import React from 'react'
import { ICON_GROUPS, resolveIcon, Ic } from '../../lib/icons'
import { cn } from '../../lib/utils'
import { t } from '../../lib/i18n'
import type { Lang } from '../../lib/types'
import { Modal, TextInput } from '../ui'

/** Searchable Lucide icon picker with curated groups. */
export function IconPicker({
  value,
  onChange,
  label,
  lang = 'en',
  trigger,
}: {
  value?: string
  onChange: (name: string) => void
  label?: string
  lang?: Lang
  trigger: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const Current = resolveIcon(value)

  const groups = React.useMemo(() => {
    if (!query.trim()) return ICON_GROUPS
    const q = query.toLowerCase()
    return ICON_GROUPS.map((g) => ({ ...g, icons: g.icons.filter((n) => n.toLowerCase().includes(q)) })).filter((g) => g.icons.length > 0)
  }, [query])

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full">
        {trigger ?? (
          <span className="field flex items-center gap-2.5">
            <Current size={16} className="text-brand-600" />
            <span className="flex-1 truncate text-start">{value || t(lang, 'pickIcon')}</span>
            <Ic n='ChevronDown' size={14} className="text-ink-400" />
          </span>
        )}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={label ?? t(lang, 'pickIcon')} subtitle={t(lang, 'iconsAvailable')} size="lg" icon="Sparkles" lang={lang}>
        <TextInput value={query} onChange={setQuery} placeholder={t(lang, 'searchIconsPlaceholder')} icon="Search" className="mb-5" />
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.group}>
              <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">{group.group}</h4>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9">
                {group.icons.map((name) => {
                  const Icon = resolveIcon(name)
                  const active = value === name
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => {
                        onChange(name)
                        setOpen(false)
                      }}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-xl border transition',
                        active ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500/20' : 'border-ink-200 text-ink-600 hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600',
                      )}
                    >
                      <Icon size={18} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
          {groups.length === 0 && <p className="py-8 text-center text-sm text-ink-500">{t(lang, 'noIconsMatch')} “{query}”.</p>}
        </div>
      </Modal>
    </>
  )
}

/** Compact inline icon button that opens the picker. */
export function IconPickerButton({ value, onChange, label, lang = 'en' }: { value?: string; onChange: (v: string) => void; label?: string; lang?: Lang }) {
  const Icon = resolveIcon(value)
  return (
    <IconPicker
      value={value}
      onChange={onChange}
      label={label}
      lang={lang}
      trigger={
        <span className="inline-flex h-9 w-full items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 text-[13px] font-semibold text-ink-700 transition hover:border-brand-300">
          <Icon size={15} className="text-brand-600" />
          <span className="truncate">{value || t(lang, 'pickIcon')}</span>
        </span>
      }
    />
  )
}
