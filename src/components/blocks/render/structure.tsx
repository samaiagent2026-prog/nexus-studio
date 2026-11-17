import React from 'react'
import { resolveIcon, Ic } from '../../../lib/icons'
import { cn, getPath, tr } from '../../../lib/utils'
import { Container, CtaRow, Editable, Element, Eyebrow, ImageBox, KitButton, Section, Stars } from '../kit'
import { useBlockCtx } from '../context'

/* ============================================================
   Hero, search hero, CTA band, spacer.
   ============================================================ */

function BackgroundDecor({ variant }: { variant?: string }) {
  if (!variant || variant === 'none') return null
  if (variant === 'mesh') return <div className="pointer-events-none absolute inset-0 mesh opacity-[0.14]" />
  if (variant === 'grid') return <div className="pointer-events-none absolute inset-0 grid-lines opacity-70" />
  if (variant === 'dots')
    return (
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />
    )
  if (variant === 'glow')
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--brand-400) 32%, transparent) 0%, transparent 70%)' }}
      />
    )
  return null
}

export function HeroRenderer() {
  const ctx = useBlockCtx()
  const { block, lang } = ctx
  const p = block.props
  const align = p.align ?? 'left'
  const layout = p.layout ?? 'split'
  const mediaFirst = (p.mediaSide ?? 'right') === 'left'
  const badges: any[] = p.badges ?? []
  const stats: any[] = p.stats ?? []
  const floating = p.floatingCard ?? {}
  const FloatingIcon = resolveIcon(floating.icon)

  const copy = (
    <div className={cn('flex flex-col gap-6', align === 'center' && 'items-center text-center', align === 'right' && 'items-end text-end')}>
      {p.eyebrow && (
        <Element k="eyebrow" as="span" className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-brand-700">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
          <Editable k="eyebrow.text" field="eyebrow" as="span" />
        </Element>
      )}
      <Editable
        k="heading"
        field="heading"
        as="h1"
        className="font-display text-[2.1rem] font-extrabold leading-[1.08] tracking-tight text-ink-950 text-balance sm:text-5xl lg:text-[3.4rem]"
      />
      <Editable k="subheading" field="subheading" as="p" className="max-w-xl text-[15px] leading-relaxed text-ink-600 text-pretty sm:text-lg" />
      <CtaRow className={cn(align === 'center' && 'justify-center')} />

      {badges.length > 0 && (
        <Element k="badges" as="div" className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 pt-1', align === 'center' && 'justify-center')}>
          {badges.map((badge, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500">
              <Ic n='CheckCircle2' size={15} className="text-brand-600" />
              <Editable k={`badge.${i}`} field={`badges.${i}.text`} as="span" affordance={false} />
            </span>
          ))}
        </Element>
      )}

      {stats.length > 0 && (
        <Element k="stats" as="dl" className={cn('mt-2 grid max-w-lg grid-cols-3 gap-6 border-t border-[var(--border)] pt-6', align === 'center' && 'mx-auto text-center')}>
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <Editable k={`stat.${i}.value`} field={`stats.${i}.value`} valueKind="plain" as="dt" className="font-display text-2xl font-extrabold tracking-tight text-ink-950 lg:text-3xl" affordance={false} />
              <Editable k={`stat.${i}.label`} field={`stats.${i}.label`} as="dd" className="text-[12.5px] font-medium text-ink-500" affordance={false} />
            </div>
          ))}
        </Element>
      )}
    </div>
  )

  const media = (
    <Element k="media" className="relative">
      {p.mediaStyle === 'stacked' ? (
        <div className="relative">
          <ImageBox k="image" field="image" src={p.image} ratio="4/5" rounded="rounded-[28px]" className="shadow-lift" />
          <div className="absolute -bottom-8 w-[58%] overflow-hidden rounded-2xl border-4 border-white shadow-lift start-[-2rem]">
            <ImageBox k="secondaryImage" field="secondaryImage" src={p.secondaryImage} ratio="4/3" rounded="rounded-xl" />
          </div>
        </div>
      ) : p.mediaStyle === 'plain' ? (
        <ImageBox k="image" field="image" src={p.image} ratio="4/5" rounded="rounded-[28px]" />
      ) : (
        <div className="relative rounded-[32px] border border-white/60 bg-white/60 p-2.5 shadow-lift backdrop-blur">
          <ImageBox k="image" field="image" src={p.image} ratio="4/5" rounded="rounded-[26px]" />
        </div>
      )}

      {p.floatingCardOn && floating.title && (
        <Element
          k="floatingCard"
          className={cn(
            'absolute flex max-w-[260px] items-start gap-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lift backdrop-blur-xl',
            mediaFirst ? 'end-[-1.5rem] bottom-8' : 'start-[-1.5rem] bottom-10',
          )}
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <FloatingIcon size={18} />
          </span>
          <div className="min-w-0">
            <Editable k="floatingCard.title" field="floatingCard.title" as="p" className="text-[13.5px] font-bold text-ink-950" />
            <Editable k="floatingCard.text" field="floatingCard.text" as="p" className="mt-1 text-[12px] leading-snug text-ink-500" />
          </div>
        </Element>
      )}

      {p.imageBadgeValue && (
        <Element k="mediaBadge" className={cn('absolute flex items-center gap-2 rounded-2xl bg-ink-950/90 px-3.5 py-2.5 text-white shadow-lift backdrop-blur', mediaFirst ? 'start-4 top-6' : 'end-4 top-6')}>
          <Stars rating={5} size={13} />
          <span className="text-[12px] font-bold">{p.imageBadgeValue}</span>
          <span className="text-[11px] text-white/60">{tr(p.imageBadgeLabel, lang)}</span>
        </Element>
      )}
    </Element>
  )

  if (layout === 'centered') {
    return (
      <Section className="overflow-hidden">
        <BackgroundDecor variant={p.backgroundStyle} />
        <div className="relative flex flex-col items-center gap-12">
          <div className="max-w-3xl">{copy}</div>
          <div className="w-full max-w-4xl">{media}</div>
        </div>
      </Section>
    )
  }

  if (layout === 'background') {
    return (
      <Section className="overflow-hidden" innerStyle={{ minHeight: '620px' }}>
        <div className="absolute inset-0">
          <ImageBox k="image" field="image" src={p.image} ratio="16/9" rounded="rounded-none" className="h-full min-h-[620px] w-full" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/70 to-ink-950/30" />
        </div>
        <div className="relative py-16 lg:py-24">
          <div className="max-w-2xl text-white [&_h1]:text-white [&_p]:text-white/75">
            {copy}
          </div>
        </div>
      </Section>
    )
  }

  return (
    <Section className="overflow-visible">
      <BackgroundDecor variant={p.backgroundStyle} />
      <div className={cn('relative grid items-center gap-14 lg:grid-cols-2 lg:gap-16', mediaFirst && 'lg:[&>*:first-child]:order-2')}>
        {copy}
        {media}
      </div>
    </Section>
  )
}

export function HeroSearchRenderer() {
  const ctx = useBlockCtx()
  const { block, lang } = ctx
  const p = block.props
  const filters: any[] = p.filters ?? []
  const quick: any[] = p.quickLinks ?? []
  const trust: any[] = p.trustItems ?? []
  const tabs: any[] = p.tabs ?? []
  const [activeTab, setActiveTab] = React.useState(0)
  const [range, setRange] = React.useState<number>(filters.find((f) => f.kind === 'range')?.value ?? 1000000)

  return (
    <Section className="overflow-hidden" innerStyle={{ minHeight: '560px' }}>
      <div className="absolute inset-0">
        <ImageBox k="backgroundImage" field="backgroundImage" src={p.backgroundImage} ratio="16/9" rounded="rounded-none" className="h-full min-h-[560px] w-full" />
        <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(9,12,24,${(p.overlay ?? 0.6) + 0.12}) 0%, rgba(9,12,24,${p.overlay ?? 0.6}) 55%, rgba(9,12,24,${Math.max(0.2, (p.overlay ?? 0.6) - 0.2)}) 100%)` }} />
      </div>

      <div className={cn('relative py-10 text-white lg:py-16', p.align === 'center' && 'text-center')}>
        <div className={cn('mx-auto max-w-3xl', p.align === 'center' && 'text-center')}>
          {p.eyebrow && (
            <Element k="eyebrow" as="span" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
              <Ic n='MapPin' size={13} />
              <Editable k="eyebrow.text" field="eyebrow" as="span" />
            </Element>
          )}
          <Editable k="heading" field="heading" as="h1" className="mt-5 font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight text-white text-balance sm:text-4xl lg:text-[3.1rem]" />
          <Editable k="subheading" field="subheading" as="p" className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75 text-pretty sm:text-lg" />
        </div>

        {/* search panel */}
        <Element k="search" className="relative mx-auto mt-9 max-w-5xl">
          <div className="rounded-[26px] border border-white/60 bg-white/95 p-2 shadow-lift backdrop-blur-2xl">
            {p.tabsOn && tabs.length > 0 && (
              <div className="flex items-center gap-1 px-2 pt-1.5">
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (ctx.mode === 'edit') return
                      setActiveTab(i)
                    }}
                    className={cn(
                      'rounded-xl px-3.5 py-2 text-[13px] font-bold transition',
                      activeTab === i ? 'bg-ink-950 text-white' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800',
                    )}
                  >
                    <Editable k={`tab.${i}`} field={`tabs.${i}.label`} as="span" affordance={false} />
                  </button>
                ))}
              </div>
            )}

            <div className="grid gap-2 p-2 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              {filters.map((f, i) => {
                const Icon = resolveIcon(f.icon)
                return (
                  <div
                    key={i}
                    data-el={ctx.mode === 'edit' ? `filter.${i}` : undefined}
                    onClick={(e) => {
                      if (ctx.mode === 'edit') {
                        e.stopPropagation()
                        ctx.select(block.id, `filter.${i}`)
                      }
                    }}
                    className={cn(
                      'group flex min-w-0 flex-col gap-1 rounded-2xl border border-ink-200/80 bg-white px-3.5 py-2.5 text-start transition hover:border-brand-300',
                      ctx.selection?.elementKey === `filter.${i}` && 'outline outline-2 outline-brand-500',
                    )}
                  >
                    <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-ink-400">
                      {Icon && <Icon size={12} />}
                      <Editable k={`filter.${i}.label`} field={`filters.${i}.label`} as="span" affordance={false} />
                    </span>
                    {f.kind === 'select' ? (
                      <select
                        onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
                        className="w-full cursor-pointer truncate border-none bg-transparent p-0 text-[13.5px] font-semibold text-ink-900 outline-none"
                        defaultValue="0"
                      >
                        {(f.options ?? []).map((opt: any, oi: number) => (
                          <option key={oi} value={oi}>{tr(opt, lang)}</option>
                        ))}
                      </select>
                    ) : f.kind === 'range' ? (
                      <div className="flex flex-col gap-1">
                        <input
                          type="range"
                          min={f.min ?? 0}
                          max={f.max ?? 1000000}
                          value={range}
                          onChange={(e) => setRange(Number(e.target.value))}
                          onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
                          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600"
                        />
                        <span className="text-[13px] font-bold text-ink-900 tabular-nums">
                          {f.prefix}
                          {new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(range)}
                        </span>
                      </div>
                    ) : (
                      <input
                        placeholder={tr(f.placeholder, lang)}
                        onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
                        className="w-full border-none bg-transparent p-0 text-[13.5px] font-semibold text-ink-900 placeholder:font-medium placeholder:text-ink-400 outline-none"
                      />
                    )}
                  </div>
                )
              })}

              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 text-sm font-bold text-white shadow-soft transition hover:bg-brand-700 md:px-7"
              >
                <Ic n='Search' size={17} />
                <Editable k="searchLabel" field="searchLabel" as="span" />
              </button>
            </div>
          </div>

          {p.quickLinksOn && quick.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[12.5px]">
              <span className="font-semibold text-white/60">
                <Editable k="quickLabel" field="quickLabel" as="span" />
              </span>
              {quick.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    if (ctx.mode === 'edit') {
                      e.stopPropagation()
                      ctx.select(block.id, `quick.${i}`)
                    }
                  }}
                  className={cn(
                    'rounded-full border border-white/25 bg-white/10 px-3 py-1 font-semibold text-white/85 backdrop-blur transition hover:bg-white/20',
                    ctx.selection?.elementKey === `quick.${i}` && 'outline outline-2 outline-brand-400',
                  )}
                >
                  <Editable k={`quick.${i}.text`} field={`quickLinks.${i}.text`} as="span" affordance={false} />
                </button>
              ))}
            </div>
          )}
        </Element>

        {p.trustOn && trust.length > 0 && (
          <Element k="trust" className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {trust.map((t, i) => {
              const Icon = resolveIcon(t.icon)
              return (
                <span key={i} className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/70">
                  <Icon size={15} className="text-white/90" />
                  <Editable k={`trust.${i}`} field={`trustItems.${i}.text`} as="span" affordance={false} />
                </span>
              )
            })}
          </Element>
        )}
      </div>
    </Section>
  )
}

export function CtaBandRenderer() {
  const ctx = useBlockCtx()
  const { block, lang } = ctx
  const p = block.props
  const variant = p.variant ?? 'gradient'
  const dark = variant === 'gradient' || variant === 'dark' || variant === 'image'

  const shell = cn(
    'relative overflow-hidden rounded-[32px] px-6 py-14 sm:px-12 lg:py-20',
    variant === 'gradient' && 'bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 text-white',
    variant === 'dark' && 'bg-ink-950 text-white',
    variant === 'soft' && 'border border-brand-100 bg-brand-50 text-ink-900',
    variant === 'image' && 'text-white',
  )

  return (
    <Section>
      <Element k="band" className={shell}>
        {variant === 'image' && p.backgroundImage && (
          <>
            <ImageBox k="backgroundImage" field="backgroundImage" src={p.backgroundImage} ratio="16/6" rounded="rounded-none" className="absolute inset-0 h-full w-full" />
            <div className="pointer-events-none absolute inset-0 bg-ink-950/70" />
          </>
        )}
        {(variant === 'gradient' || variant === 'dark') && <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />}
        {variant === 'gradient' && (
          <div className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        )}

        <div className={cn('relative flex flex-col gap-8', p.align === 'center' ? 'items-center text-center' : 'items-start lg:flex-row lg:items-center lg:justify-between')}>
          <div className={cn('flex flex-col gap-4', p.align === 'center' ? 'items-center' : '')}>
            {p.eyebrow && (
              <span className={cn('inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em]', dark ? 'bg-white/15 text-white' : 'bg-white text-brand-700')}>
                <Editable k="eyebrow" field="eyebrow" as="span" />
              </span>
            )}
            <Editable k="heading" field="heading" as="h2" className={cn('max-w-2xl font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-balance lg:text-[2.6rem]', dark ? 'text-white' : 'text-ink-950')} />
            <Editable k="subheading" field="subheading" as="p" className={cn('max-w-xl text-[15px] leading-relaxed', dark ? 'text-white/75' : 'text-ink-600')} />

            {p.showAvatars && (
              <div className={cn('mt-1 flex items-center gap-3', p.align === 'center' && 'justify-center')}>
                <div className="flex -space-x-3 rtl:space-x-reverse">
                  {['tst-1', 'tst-2', 'tst-3', 'team-1'].map((seed) => (
                    <img key={seed} src={`https://picsum.photos/seed/${seed}/80/80`} alt="" className={cn('h-9 w-9 rounded-full border-2 object-cover', dark ? 'border-white/30' : 'border-white')} />
                  ))}
                </div>
                <Editable k="note" field="noteText" as="span" className={cn('text-[12.5px] font-semibold', dark ? 'text-white/70' : 'text-ink-500')} />
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <KitButton k="primaryCta.button" field="primaryCta.label" href={p.primaryCta?.href} icon={p.primaryCta?.icon} iconRight={p.primaryCta?.iconRight ?? 'ArrowRight'} variant={p.primaryCta?.variant ?? (dark ? 'glass' : 'primary')} size="lg" />
            {p.secondaryCta?.label && tr(p.secondaryCta.label, lang) && (
              <KitButton k="secondaryCta.button" field="secondaryCta.label" href={p.secondaryCta?.href} icon={p.secondaryCta?.icon} variant={p.secondaryCta?.variant ?? (dark ? 'glass' : 'outline')} size="lg" />
            )}
          </div>
        </div>
      </Element>
    </Section>
  )
}

export function SpacerRenderer() {
  const ctx = useBlockCtx()
  const p = ctx.block.props
  const size = p.size ?? 48
  if (!p.showLine) {
    return (
      <Element k="spacer" className="flex w-full items-center justify-center" style={{ height: size }}>
        <span className="h-full w-full" />
      </Element>
    )
  }
  return (
    <Element k="spacer" className="flex w-full items-center justify-center" style={{ height: size }}>
      <span
        className={cn('h-px w-full max-w-[var(--shell)]', p.lineStyle === 'dashed' && 'border-t border-dashed border-[var(--border-strong)]', p.lineStyle === 'gradient' && 'bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent')}
        style={p.lineStyle === 'solid' ? { background: 'var(--border-strong)' } : undefined}
      />
    </Element>
  )
}
