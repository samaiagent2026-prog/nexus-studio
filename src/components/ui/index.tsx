import React from 'react'
import { resolveIcon, Ic } from '../../lib/icons'
import { cn, readableOn } from '../../lib/utils'
import { t } from '../../lib/i18n'
import type { Lang } from '../../lib/types'

/* ============================================================
   Studio UI primitives — used by the dashboard, inspector and
   admin panel. Intentionally dependency-free beyond Tailwind.
   ============================================================ */

export function Field({ label, hint, children, className }: { label?: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 text-[11px] leading-snug text-ink-400">{hint}</span>}
    </div>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  icon,
  className,
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: string
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const Icon = icon ? resolveIcon(icon) : null
  return (
    <div className={cn('relative', className)}>
      {Icon && <Icon size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-400" />}
      <input
        {...rest}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn('field', Icon && 'ps-9')}
      />
    </div>
  )
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
  className?: string
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cn('field resize-y leading-relaxed', className)}
    />
  )
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  className,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  className?: string
}) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('field tabular-nums', suffix && 'pe-12')}
      />
      {suffix && <span className="pointer-events-none absolute end-3 text-[11px] font-semibold text-ink-400">{suffix}</span>}
    </div>
  )
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit,
  label,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  label?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        {label && <span className="text-[11.5px] font-semibold text-ink-500">{label}</span>}
        <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-ink-700">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600 outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:shadow-soft"
        style={{ background: `linear-gradient(to right, var(--brand-500) ${pct}%, #e2e8f0 ${pct}%)` }}
      />
    </div>
  )
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field cursor-pointer appearance-none pe-9">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Ic n='ChevronDown' size={15} className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-ink-400" />
    </div>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label?: string; hint?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-3 text-start">
      {(label || hint) && (
        <span className="min-w-0">
          {label && <span className="block text-[12.5px] font-semibold text-ink-700">{label}</span>}
          {hint && <span className="block text-[11px] text-ink-400">{hint}</span>}
        </span>
      )}
      <span className={cn('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-ink-300')}>
        <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0.5 rtl:-translate-x-0.5')} />
      </span>
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label?: string; icon?: string; title?: string }[]
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-xl border border-ink-200 bg-ink-50 p-0.5', className)}>
      {options.map((o) => {
        const Icon = o.icon ? resolveIcon(o.icon) : null
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            title={o.title ?? o.label}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-[10px] font-semibold transition-all',
              size === 'sm' ? 'px-2.5 py-1.5 text-[11.5px]' : 'px-3 py-1.5 text-[12.5px]',
              active ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-800',
            )}
          >
            {Icon && <Icon size={size === 'sm' ? 14 : 15} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function ColorInput({ value, onChange, allowClear, lang = 'en' }: { value?: string; onChange: (v: string) => void; allowClear?: boolean; lang?: 'en' | 'ar' }) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const safe = value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#3b5ef6'
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-ink-200 shadow-inner transition hover:scale-105"
        style={{ background: value || 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 10px 10px' }}
        aria-label={t(lang, 'pickColour')}
      >
        <span className="absolute inset-0" style={{ background: value || 'transparent' }} />
      </button>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#3b5ef6"
        className="field flex-1 font-mono text-[12px]"
      />
      {allowClear && value && (
        <button type="button" onClick={() => onChange('')} className="btn-ghost !px-2" title={t(lang, 'clear')}>
          <Ic n='X' size={14} />
        </button>
      )}
      <input ref={inputRef} type="color" value={safe} onChange={(e) => onChange(e.target.value)} className="sr-only" />
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  icon,
  lang = 'en',
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: string
  lang?: Lang
}) {
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const Icon = icon ? resolveIcon(icon) : null
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
      <div className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cn('relative my-auto w-full animate-scale-in rounded-3xl border border-white/60 bg-white shadow-lift', widths[size])}>
        <div className="flex items-start gap-3 border-b border-[var(--border)] p-5 sm:p-6">
          {Icon && (
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon size={19} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-extrabold tracking-tight text-ink-950">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-ink-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost !px-2" aria-label={t(lang, 'close')}>
            <Ic n='X' size={18} />
          </button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto p-5 sm:p-6">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-2)] p-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      icon="AlertTriangle"
      footer={
        <>
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[14px] leading-relaxed text-ink-600">{message}</p>
    </Modal>
  )
}

export function Dropdown({
  trigger,
  children,
  align = 'end',
  className,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode
  children: (props: { close: () => void }) => React.ReactNode
  align?: 'start' | 'end'
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className={cn('relative', className)} ref={ref}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={cn(
            'absolute top-[calc(100%+6px)] z-50 min-w-[200px] animate-scale-in rounded-2xl border border-ink-200 bg-white p-1.5 shadow-lift',
            align === 'end' ? 'end-0' : 'start-0',
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  icon,
  label,
  onClick,
  danger,
  shortcut,
  active,
}: {
  icon?: string
  label: string
  onClick?: () => void
  danger?: boolean
  shortcut?: string
  active?: boolean
}) {
  const Icon = icon ? resolveIcon(icon) : null
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-start text-[13px] font-semibold transition',
        danger ? 'text-rose-600 hover:bg-rose-50' : active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-100',
      )}
    >
      {Icon && <Icon size={15} className="shrink-0" />}
      <span className="flex-1 truncate">{label}</span>
      {shortcut && <span className="text-[10.5px] font-medium text-ink-400">{shortcut}</span>}
    </button>
  )
}

export function Tooltip({ label, children, side = 'top' }: { label: string; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        className={cn(
          'pointer-events-none absolute z-[70] hidden whitespace-nowrap rounded-lg bg-ink-950 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lift transition-opacity group-hover/tt:block group-hover/tt:opacity-100',
          side === 'top' && 'bottom-[calc(100%+6px)] start-1/2 -translate-x-1/2 rtl:translate-x-1/2',
          side === 'bottom' && 'top-[calc(100%+6px)] start-1/2 -translate-x-1/2 rtl:translate-x-1/2',
          side === 'left' && 'end-[calc(100%+6px)] top-1/2 -translate-y-1/2',
          side === 'right' && 'start-[calc(100%+6px)] top-1/2 -translate-y-1/2',
        )}
      >
        {label}
      </span>
    </span>
  )
}

export function IconButton({
  icon,
  label,
  onClick,
  active,
  danger,
  size = 'md',
  className,
  disabled,
}: {
  icon: string
  label: string
  onClick?: (e: React.MouseEvent) => void
  active?: boolean
  danger?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}) {
  const Icon = resolveIcon(icon)
  const sizes = { sm: 'h-7 w-7', md: 'h-9 w-9', lg: 'h-10 w-10' }
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-40',
          sizes[size],
          active ? 'bg-brand-600 text-white shadow-soft' : danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
          className,
        )}
      >
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 19 : 16} />
      </button>
    </Tooltip>
  )
}

export function Badge({ children, tone = 'neutral', className, icon }: { children: React.ReactNode; tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'dark'; className?: string; icon?: string }) {
  const Icon = icon ? resolveIcon(icon) : null
  const tones = {
    neutral: 'bg-ink-100 text-ink-700',
    brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100',
    dark: 'bg-ink-950 text-white',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold', tones[tone], className)}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  )
}

export function Avatar2({ name, src, size = 36, className }: { name?: string; src?: string; size?: number; className?: string }) {
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display font-bold text-brand-700', className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials || '?'}
    </span>
  )
}

export function Toasts({ toasts, onDismiss }: { toasts: { id: string; kind: string; message: string }[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-5 start-1/2 z-[120] flex -translate-x-1/2 flex-col items-center gap-2 rtl:translate-x-1/2">
      {toasts.map((t) => {
        const Icon = resolveIcon(t.kind === 'error' ? 'AlertTriangle' : t.kind === 'info' ? 'Info' : 'CheckCircle2')
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onDismiss(t.id)}
            className={cn(
              'pointer-events-auto flex animate-fade-up items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-semibold shadow-lift backdrop-blur',
              t.kind === 'error' ? 'bg-rose-600 text-white' : t.kind === 'info' ? 'bg-ink-950 text-white' : 'bg-emerald-600 text-white',
            )}
          >
            <Icon size={16} />
            {t.message}
          </button>
        )
      })}
    </div>
  )
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-ink-200', className)}>
      <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function EmptyState({ icon, title, message, action }: { icon: string; title: string; message: string; action?: React.ReactNode }) {
  const Icon = resolveIcon(icon)
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-ink-300 bg-white/60 px-8 py-16 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon size={26} />
      </span>
      <h3 className="font-display text-lg font-extrabold text-ink-950">{title}</h3>
      <p className="max-w-sm text-[13.5px] leading-relaxed text-ink-500">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: string; label: string; icon?: string; badge?: string | number }[]
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto scrollbar-none', className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon ? resolveIcon(tab.icon) : null
        const active = value === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-bold transition',
              active ? 'bg-ink-950 text-white shadow-soft' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900',
            )}
          >
            {Icon && <Icon size={15} />}
            {tab.label}
            {tab.badge != null && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-bold', active ? 'bg-white/20' : 'bg-ink-200 text-ink-600')}>{tab.badge}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function SwatchPicker({ colors, value, onChange }: { colors: string[]; value?: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          title={c}
          className={cn('h-7 w-7 rounded-lg border transition hover:scale-110', value === c ? 'border-ink-900 ring-2 ring-ink-900/20' : 'border-black/10')}
          style={{ background: c }}
        />
      ))}
    </div>
  )
}

export { readableOn }
