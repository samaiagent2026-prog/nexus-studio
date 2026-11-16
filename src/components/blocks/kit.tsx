import React from 'react'
import { resolveIcon, Ic } from '../../lib/icons'
import type { Block, Lang } from '../../lib/types'
import { cn, getPath, tr } from '../../lib/utils'
import { Editable, EditableItem, Element, elementStyleToCss, useBlockCtx, useCanvasBridge } from './context'

export { Editable, EditableItem, Element }

/* ============================================================
   Shared building kit. Every visual primitive is "live" in edit
   mode: it can be selected, and text primitives are inline
   editable. Styling always merges element overrides on top of
   the variant defaults so the inspector can win.
   ============================================================ */

export function Container({
  children,
  className,
  style,
  narrow,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  narrow?: boolean
}) {
  const ctx = useBlockCtx()
  return (
    <div
      className={cn('mx-auto w-full px-5 sm:px-6 lg:px-8', className)}
      style={{ maxWidth: narrow ? '860px' : 'var(--shell, 1200px)', ...style }}
    >
      {children}
    </div>
  )
}

const PAD: Record<number, string> = {
  0: 'py-0', 12: 'py-3', 16: 'py-4', 24: 'py-6', 32: 'py-8', 40: 'py-10',
  48: 'py-12', 56: 'py-14', 64: 'py-16', 80: 'py-20', 96: 'py-24', 112: 'py-28', 128: 'py-32',
}

/** Section shell: background, overlay, padding, radius and reveal animation. */
export function Section({
  children,
  className,
  contentClassName,
  narrow,
  innerStyle,
}: {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  narrow?: boolean
  innerStyle?: React.CSSProperties
}) {
  const ctx = useBlockCtx()
  const s = ctx.block.style ?? {}
  const padY = s.paddingY ?? 64
  const padClass = PAD[padY]
  const anim = s.animation && s.animation !== 'none' ? `animate-${s.animation}` : ''

  return (
    <section
      className={cn('relative w-full overflow-hidden', padClass, className, anim)}
      style={{
        background: s.bg || undefined,
        backgroundImage: s.bgImage ? `url(${s.bgImage})` : undefined,
        backgroundSize: s.bgImage ? (s.bgSize ?? 'cover') : undefined,
        backgroundPosition: 'center',
        borderRadius: s.radius ? `${s.radius}px` : undefined,
        borderTop: s.borderTop ? '1px solid var(--border)' : undefined,
        borderBottom: s.borderBottom ? '1px solid var(--border)' : undefined,
        paddingTop: padClass ? undefined : `${padY}px`,
        paddingBottom: padClass ? undefined : `${padY}px`,
        paddingLeft: s.paddingX != null ? `${s.paddingX}px` : undefined,
        paddingRight: s.paddingX != null ? `${s.paddingX}px` : undefined,
        color: 'var(--fg)',
        ...innerStyle,
      }}
      data-block-id={ctx.block.id}
      data-block-type={ctx.block.type}
    >
      {s.bgImage && s.bgOverlay != null && (
        <div className="pointer-events-none absolute inset-0" style={{ background: `rgba(0,0,0,${s.bgOverlay})` }} />
      )}
      <div className="relative">
        <Container narrow={narrow} className={contentClassName}>
          {children}
        </Container>
      </div>
    </section>
  )
}

/* ---------------- headings & text ---------------- */

export function SectionHeading({
  k,
  field,
  eyebrowField,
  eyebrowK,
  subtitleField,
  subtitleK,
  align = 'center',
  className,
  light,
}: {
  k: string
  field?: string
  eyebrowField?: string
  eyebrowK?: string
  subtitleField?: string
  subtitleK?: string
  align?: 'left' | 'center' | 'right'
  className?: string
  light?: boolean
}) {
  const ctx = useBlockCtx()
  const hasEyebrow = !!eyebrowField && !!tr(getPath(ctx.block.props, eyebrowField), ctx.lang)
  const hasSub = !!subtitleField && !!tr(getPath(ctx.block.props, subtitleField), ctx.lang)
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        align === 'right' && 'items-end text-end',
        className,
      )}
    >
      {hasEyebrow && (
        <Element k={eyebrowK ?? 'eyebrow'} as="span" className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
          <Editable k={`${eyebrowK ?? 'eyebrow'}.text`} field={eyebrowField} as="span" />
        </Element>
      )}
      {field && (
        <Editable
          k={k}
          field={field}
          as="h2"
          className={cn(
            'font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]',
            light ? 'text-white' : 'text-ink-950',
          )}
        />
      )}
      {hasSub && (
        <Editable
          k={subtitleK ?? 'subtitle'}
          field={subtitleField}
          as="p"
          className={cn('max-w-2xl text-base leading-relaxed text-pretty sm:text-lg', light ? 'text-white/80' : 'text-ink-600')}
        />
      )}
    </div>
  )
}

export function Eyebrow({ k, field, className }: { k: string; field?: string; className?: string }) {
  const ctx = useBlockCtx()
  return (
    <Element k={k} as="span" className={cn('inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-brand-700', className)}>
      <Editable k={`${k}.text`} field={field} as="span" />
    </Element>
  )
}

/* ---------------- buttons ---------------- */

/**
 * Inline-editable label inside a button. Kept as a nested span so the
 * button itself remains a single selectable element while the text can
 * still be edited directly on the canvas.
 */
function InlineLabel({ field, fallback }: { field: string; fallback: string }) {
  const ctx = useBlockCtx()
  const [editing, setEditing] = React.useState(false)
  const ref = React.useRef<HTMLSpanElement | null>(null)
  const text = tr(getPath(ctx.block.props, field), ctx.lang)

  const start = (e: React.MouseEvent) => {
    if (ctx.mode !== 'edit') return
    e.stopPropagation()
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
  }

  const commit = () => {
    const el = ref.current
    if (!el) return
    el.removeAttribute('contenteditable')
    setEditing(false)
    const next = el.innerText.replace(/\u00a0/g, ' ').replace(/\s+$/, '')
    const current = getPath(ctx.block.props, field)
    if ((current?.en ?? '') !== next || ctx.lang === 'ar') {
      ctx.updateProp(field, { ...(typeof current === 'object' && current ? current : {}), [ctx.lang]: next })
    }
  }

  return (
    <span
      ref={ref}
      onDoubleClick={start}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault()
          ;(e.currentTarget as HTMLElement).blur()
        }
      }}
      className={cn(editing && 'outline outline-2 outline-white/70')}
      suppressContentEditableWarning
    >
      {text || fallback}
    </span>
  )
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'glass' | 'dark' | 'gradient'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-lift',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  outline: 'border-2 border-brand-600 text-brand-700 hover:bg-brand-600 hover:text-white',
  ghost: 'text-ink-700 hover:bg-ink-100',
  link: 'px-0 text-brand-600 underline-offset-4 hover:underline',
  glass: 'glass text-ink-900 hover:bg-white/90',
  dark: 'bg-ink-950 text-white hover:bg-ink-800',
  gradient: 'text-white bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 shadow-lift hover:brightness-110',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-[15px]',
  xl: 'px-8 py-4 text-base',
}

const HOVER: Record<string, string> = {
  none: '',
  lift: 'hover:-translate-y-0.5',
  grow: 'hover:scale-[1.04]',
  glow: 'hover:shadow-glow',
  shine: 'relative overflow-hidden',
}

export function KitButton({
  k,
  field,
  href,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  hover = 'lift',
  className,
  iconOnly,
  blockId,
  onClick,
}: {
  k: string
  field?: string
  href?: string
  icon?: string
  iconRight?: string
  variant?: ButtonVariant
  size?: ButtonSize
  hover?: string
  className?: string
  iconOnly?: boolean
  blockId?: string
  onClick?: (e: React.MouseEvent) => void
}) {
  const ctx = useBlockCtx()
  const bridge = useCanvasBridge()
  const overrides = ctx.block.elements?.[k]
  const Icon = icon ? resolveIcon(icon) : null
  const IconRight = iconRight ? resolveIcon(iconRight) : null
  const editing = ctx.mode === 'edit'
  const selected = ctx.selection?.blockId === ctx.block.id && ctx.selection?.elementKey === k
  const radius = overrides?.radius
  const resolvedHref = href ? ctx.href(href) : undefined

  const label = field ? tr(getPath(ctx.block.props, field), ctx.lang) : ''
  const Tag: any = href && !editing ? 'a' : 'button'

  if (overrides?.hidden && !editing) return null

  return (
    <Tag
      {...(Tag === 'a' ? { href: resolvedHref, target: /^https?:/.test(resolvedHref ?? '') ? '_blank' : undefined, rel: 'noreferrer' } : { type: 'button' })}
      data-el={editing ? k : undefined}
      data-hidden={editing && overrides?.hidden ? 'true' : undefined}
      className={cn(
        'group/btn inline-flex select-none items-center justify-center gap-2 font-semibold transition-all duration-200',
        iconOnly ? 'rounded-full p-3' : 'rounded-xl',
        VARIANT[variant] ?? VARIANT.primary,
        SIZE[size] ?? SIZE.md,
        HOVER[hover] ?? '',
        editing && 'cursor-pointer',
        editing && !selected && 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-brand-400/70',
        selected && 'outline outline-2 outline-brand-500',
        editing && overrides?.hidden && 'opacity-35 saturate-0 outline outline-1 outline-dashed outline-ink-400',
        className,
      )}
      style={{
        ...elementStyleToCss(overrides),
        ...(radius != null ? { borderRadius: iconOnly ? '9999px' : `${radius}px` } : {}),
      }}
      onClick={(e: React.MouseEvent) => {
        if (editing) {
          e.preventDefault()
          e.stopPropagation()
          ctx.select(ctx.block.id, k)
          return
        }
        onClick?.(e)
      }}
      onContextMenu={(e: React.MouseEvent) => {
        if (!editing || !bridge) return
        e.preventDefault()
        e.stopPropagation()
        ctx.select(ctx.block.id, k)
        bridge.requestMenu({ x: e.clientX, y: e.clientY, blockId: ctx.block.id, elementKey: k, kind: 'element' })
      }}
    >
      {Icon && <Icon size={size === 'lg' || size === 'xl' ? 19 : 17} className="shrink-0" />}
      {field ? <InlineLabel field={field} fallback={label} /> : null}
      {IconRight && <IconRight size={size === 'lg' || size === 'xl' ? 19 : 17} className={cn('shrink-0 transition-transform group-hover/btn:translate-x-0.5', ctx.dir === 'rtl' && 'rotate-180')} />}
    </Tag>
  )
}

/** Renders a paired CTA row (primary + secondary) with shared alignment. */
export function CtaRow({
  primaryK = 'primaryCta',
  secondaryK = 'secondaryCta',
  className,
}: {
  primaryK?: string
  secondaryK?: string
  className?: string
}) {
  const ctx = useBlockCtx()
  const p = ctx.block.props[primaryK] ?? {}
  const s = ctx.block.props[secondaryK]
  const showPrimary = p.label && tr(p.label, ctx.lang)
  const showSecondary = s && s.label && tr(s.label, ctx.lang)
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {showPrimary && (
        <KitButton k={`${primaryK}.button`} field={`${primaryK}.label`} href={p.href} icon={p.icon} iconRight={p.iconRight} variant={p.variant ?? 'primary'} size={p.size ?? 'lg'} hover={p.hover ?? 'lift'} />
      )}
      {showSecondary && (
        <KitButton k={`${secondaryK}.button`} field={`${secondaryK}.label`} href={s.href} icon={s.icon} variant={s.variant ?? 'outline'} size={s.size ?? 'lg'} hover={s.hover ?? 'lift'} />
      )}
    </div>
  )
}

/* ---------------- small primitives ---------------- */

export function Stars({ rating = 5, size = 15, className }: { rating?: number; size?: number; className?: string }) {
  const Star = resolveIcon('Star')
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-ink-300'} />
      ))}
    </span>
  )
}

export function IconBadge({
  icon,
  className,
  size = 22,
  tone = 'brand',
  round = 'xl2',
}: {
  icon?: string
  className?: string
  size?: number
  tone?: 'brand' | 'soft' | 'solid' | 'glass' | 'outline'
  round?: 'full' | 'xl2' | 'lg'
}) {
  const Icon = resolveIcon(icon)
  const tones = {
    brand: 'bg-brand-600 text-white shadow-soft',
    soft: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
    solid: 'bg-ink-950 text-white',
    glass: 'glass text-ink-900',
    outline: 'border border-ink-200 bg-white text-ink-800',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        round === 'full' ? 'rounded-full' : round === 'lg' ? 'rounded-xl' : 'rounded-2xl',
        tones[tone],
        'h-11 w-11',
        className,
      )}
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  )
}

export function PriceTag({ value, lang, className, size = 'md' }: { value: any; lang: Lang; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const currency = value?.currency ?? 'USD'
  const amount = value?.amount ?? 0
  const symbol = ({ USD: '$', EUR: '€', GBP: '£', AED: 'د.إ', SAR: '﷼', TRY: '₺' } as Record<string, string>)[currency] ?? currency
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' }
  const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { maximumFractionDigits: 0 }).format(amount)
  return (
    <span className={cn('inline-flex items-baseline gap-1 font-display font-extrabold text-ink-950', sizes[size], className)}>
      <span>{symbol}</span>
      <span>{formatted}</span>
      {value?.suffix && <span className="text-xs font-medium text-ink-500">{tr(value.suffix, lang)}</span>}
    </span>
  )
}

export function Avatar({ src, name, size = 56, className }: { src?: string; name?: string; size?: number; className?: string }) {
  const initials = (name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-display font-bold text-brand-700 ring-2 ring-white', className)}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {src ? <img src={src} alt={name ?? ''} className="h-full w-full object-cover" loading="lazy" /> : initials || '—'}
    </span>
  )
}

export function Stat({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="font-display text-3xl font-extrabold tracking-tight text-ink-950 lg:text-4xl">{value}</span>
      <span className="text-sm font-medium text-ink-500">{label}</span>
    </div>
  )
}

export function Pill({ children, className, icon }: { children: React.ReactNode; className?: string; icon?: string }) {
  const Icon = icon ? resolveIcon(icon) : null
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700', className)}>
      {Icon && <Icon size={13} />}
      {children}
    </span>
  )
}

export function Card({ children, className, style, hover = true }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; hover?: boolean }) {
  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-soft',
        hover && 'transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}

export function ImageBox({
  src,
  alt,
  className,
  ratio = '4/3',
  rounded = 'rounded-2xl',
  overlay,
  children,
}: {
  src?: string
  alt?: string
  className?: string
  ratio?: string
  rounded?: string
  overlay?: React.ReactNode
  children?: React.ReactNode
}) {
  const [failed, setFailed] = React.useState(false)
  const hasSrc = !!src && !failed
  return (
    <div className={cn('relative w-full overflow-hidden bg-ink-100', rounded, className)} style={{ aspectRatio: ratio }}>
      {hasSrc ? (
        <img src={src} alt={alt ?? ''} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
      ) : (
        <div className="mesh flex h-full w-full items-center justify-center opacity-90">
          <Ic n='Image' size={34} className="text-white/70" />
        </div>
      )}
      {overlay}
      {children}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-[var(--border)]', className)} />
}

/** Reads a localized prop directly — handy inside list renderers. */
export function useLang() {
  const ctx = useBlockCtx()
  return ctx.lang
}

export const blockIdOf = (block: Block) => block.id
