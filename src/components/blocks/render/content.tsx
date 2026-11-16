import React from 'react'
import { resolveIcon, Ic } from '../../../lib/icons'
import { cn, tr } from '../../../lib/utils'
import { Card, Container, Editable, EditableItem, Element, IconBadge, ImageBox, KitButton, Section, SectionHeading } from '../kit'
import { useBlockCtx } from '../context'

/* ============================================================
   Content blocks: rich text, image+text, stats, steps, tabs,
   feature grid, gallery.
   ============================================================ */

const alignClass = (a?: string) => (a === 'center' ? 'text-center items-center' : a === 'right' ? 'text-end items-end' : 'text-start items-start')
const headingAlign = (a?: string) => (a === 'center' ? 'center' : a === 'right' ? 'right' : 'left')

export function RichTextRenderer() {
  const ctx = useBlockCtx()
  const { block, lang } = ctx
  const p = block.props
  const bullets: any[] = p.bullets ?? []
  const two = !!p.twoColumn

  return (
    <Section>
      <div className={cn('grid gap-12', two && p.showImage ? 'lg:grid-cols-2 lg:items-center' : '')}>
        <div className={cn('flex flex-col gap-6', !two && 'mx-auto max-w-3xl', alignClass(p.align))}>
          {p.eyebrow && (
            <Element k="eyebrow" as="span" className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-700">
              <Editable k="eyebrow.text" field="eyebrow" as="span" />
            </Element>
          )}
          <Editable k="heading" field="heading" as="h2" className="font-display text-3xl font-extrabold leading-[1.14] tracking-tight text-ink-950 text-balance sm:text-4xl" />
          <Editable k="body" field="body" as="p" className="text-[15px] leading-relaxed text-ink-600 text-pretty sm:text-[16.5px]" />

          {p.showBullets && bullets.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Ic n='Check' size={12} strokeWidth={3} />
                  </span>
                  <Editable k={`bullet.${i}`} field={`bullets.${i}.text`} as="span" className="text-[14.5px] font-medium text-ink-700" affordance={false} />
                </li>
              ))}
            </ul>
          )}

          {p.quote && (
            <Element k="quote" className="relative mt-2 rounded-2xl border border-ink-200/70 bg-[var(--surface-2)] p-6">
              <Ic n='Quote' size={26} className="absolute -top-3 start-6 rounded-lg bg-white p-1 text-brand-500 shadow-soft" />
              <Editable k="quote.text" field="quote" as="blockquote" className="font-display text-lg font-semibold leading-snug text-ink-900" />
              <Editable k="quote.author" field="quoteAuthor" as="cite" className="mt-3 block text-[13px] font-medium not-italic text-ink-500" />
            </Element>
          )}
        </div>

        {p.showImage && (
          <Element k="media" className={cn(two && p.showImage ? '' : 'mt-10')}>
            <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/60 p-2.5 shadow-lift backdrop-blur">
              <ImageBox src={p.image} ratio="5/4" rounded="rounded-[22px]" />
            </div>
          </Element>
        )}
      </div>
    </Section>
  )
}

export function ImageTextRenderer() {
  const ctx = useBlockCtx()
  const { block, lang } = ctx
  const p = block.props
  const bullets: any[] = p.bullets ?? []
  const mediaLeft = (p.mediaSide ?? 'left') === 'left'

  return (
    <Section>
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <Element k="media" className={cn('relative', mediaLeft ? 'lg:order-1' : 'lg:order-2')}>
          <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/60 p-2.5 shadow-lift backdrop-blur">
            <ImageBox src={p.image} ratio="5/4" rounded="rounded-[22px]" />
          </div>
          {p.statOn && (
            <Element k="statCard" className={cn('absolute flex flex-col rounded-2xl border border-white/70 bg-white/95 px-5 py-4 shadow-lift backdrop-blur-xl', mediaLeft ? '-bottom-6 end-6' : '-bottom-6 start-6')}>
              <span className="font-display text-3xl font-extrabold tracking-tight text-brand-600">{p.statValue}</span>
              <Editable k="statLabel" field="statLabel" as="span" className="text-[12.5px] font-semibold text-ink-500" />
            </Element>
          )}
        </Element>

        <div className={cn('flex flex-col gap-6', mediaLeft ? 'lg:order-2' : 'lg:order-1')}>
          {p.eyebrow && (
            <Element k="eyebrow" as="span" className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-700">
              <Editable k="eyebrow.text" field="eyebrow" as="span" />
            </Element>
          )}
          <Editable k="heading" field="heading" as="h2" className="font-display text-3xl font-extrabold leading-[1.14] tracking-tight text-ink-950 text-balance sm:text-4xl" />
          <Editable k="body" field="body" as="p" className="text-[15px] leading-relaxed text-ink-600 text-pretty" />

          {bullets.length > 0 && (
            <ul className="flex flex-col gap-3">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-ink-200/70 bg-white px-4 py-3 shadow-soft transition hover:border-brand-200 hover:shadow-lift">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                    <Ic n='Check' size={13} strokeWidth={3} />
                  </span>
                  <Editable k={`bullet.${i}`} field={`bullets.${i}.text`} as="span" className="text-[14.5px] font-medium text-ink-700" affordance={false} />
                </li>
              ))}
            </ul>
          )}

          {p.primaryCta?.label && tr(p.primaryCta.label, lang) && (
            <div>
              <KitButton k="primaryCta.button" field="primaryCta.label" href={p.primaryCta.href} iconRight={p.primaryCta.iconRight ?? 'ArrowRight'} variant={p.primaryCta.variant ?? 'primary'} size="lg" />
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

export function StatsRenderer() {
  const ctx = useBlockCtx()
  const p = ctx.block.props
  const items: any[] = p.items ?? []
  const variant = p.variant ?? 'cards'
  const dark = variant === 'dark'

  return (
    <Section className={dark ? 'text-white' : ''} innerStyle={dark ? { background: 'linear-gradient(135deg,#0e1017,#1e2c7d)' } : undefined}>
      {(p.heading || p.eyebrow) && (
        <SectionHeading
          k="heading"
          field="heading"
          eyebrowField="eyebrow"
          subtitleField="subheading"
          align={headingAlign(p.align)}
          light={dark}
          className="mb-12"
        />
      )}
      <div
        className={cn(
          'grid gap-6',
          variant === 'strip' ? 'rounded-3xl border border-ink-200/70 bg-white p-2 shadow-soft sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4',
        )}
      >
        {items.map((item, i) => {
          const Icon = resolveIcon(item.icon)
          const isCards = variant === 'cards' || variant === 'dark'
          return (
            <EditableItem
              key={i}
              k="items"
              field="items"
              index={i}
              className={cn(
                'flex flex-col gap-3 p-6',
                isCards && !dark && 'rounded-2xl border border-ink-200/70 bg-white shadow-soft transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift',
                isCards && dark && 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur',
                variant === 'strip' && i < items.length - 1 && 'border-ink-200/70 border-e',
              )}
            >
              <IconBadge icon={item.icon} tone={dark ? 'glass' : 'soft'} />
              <Editable k={`item.${i}.value`} field={`items.${i}.value`} valueKind="plain" as="span" className={cn('font-display text-3xl font-extrabold tracking-tight', dark ? 'text-white' : 'text-ink-950')} affordance={false} />
              <Editable k={`item.${i}.label`} field={`items.${i}.label`} as="span" className={cn('text-sm font-bold', dark ? 'text-white/85' : 'text-ink-800')} affordance={false} />
              {item.text && tr(item.text, ctx.lang) && (
                <Editable k={`item.${i}.text`} field={`items.${i}.text`} as="p" className={cn('text-[13.5px] leading-relaxed', dark ? 'text-white/60' : 'text-ink-500')} affordance={false} />
              )}
            </EditableItem>
          )
        })}
      </div>
    </Section>
  )
}

export function StepsRenderer() {
  const ctx = useBlockCtx()
  const p = ctx.block.props
  const items: any[] = p.items ?? []
  const variant = p.variant ?? 'numbered'

  return (
    <Section>
      <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-14" />

      {variant === 'timeline' ? (
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute bottom-4 start-[19px] top-4 w-px bg-gradient-to-b from-brand-400 via-brand-300 to-transparent" />
          <div className="flex flex-col gap-10">
            {items.map((item, i) => {
              const Icon = resolveIcon(item.icon)
              return (
                <EditableItem key={i} k="items" index={i} className="relative flex gap-6 ps-0">
                  <span className="relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-soft ring-4 ring-white">
                    <Icon size={18} />
                  </span>
                  <div className="flex flex-col gap-1.5 pb-2">
                    <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-600">Step {i + 1}</span>
                    <Editable k={`item.${i}.title`} field={`items.${i}.title`} as="h3" className="font-display text-xl font-bold text-ink-950" affordance={false} />
                    <Editable k={`item.${i}.text`} field={`items.${i}.text`} as="p" className="max-w-xl text-[14.5px] leading-relaxed text-ink-600" affordance={false} />
                  </div>
                </EditableItem>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {items.map((item, i) => {
            const Icon = resolveIcon(item.icon)
            return (
              <EditableItem
                key={i}
                k="items"
                field="items"
                index={i}
                className={cn(
                  'relative flex flex-col gap-4 p-7',
                  variant === 'cards' ? 'rounded-2xl border border-ink-200/70 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lift' : 'rounded-2xl bg-[var(--surface-2)]',
                )}
              >
                <span className="absolute end-6 top-5 font-display text-5xl font-extrabold text-ink-100">{String(i + 1).padStart(2, '0')}</span>
                <IconBadge icon={item.icon} tone="brand" />
                <Editable k={`item.${i}.title`} field={`items.${i}.title`} as="h3" className="relative font-display text-lg font-bold text-ink-950" affordance={false} />
                <Editable k={`item.${i}.text`} field={`items.${i}.text`} as="p" className="relative text-[14.5px] leading-relaxed text-ink-600" affordance={false} />
              </EditableItem>
            )
          })}
        </div>
      )}
    </Section>
  )
}

export function TabsRenderer() {
  const ctx = useBlockCtx()
  const { block, lang } = ctx
  const p = block.props
  const tabs: any[] = p.tabs ?? []
  const [active, setActive] = React.useState(0)
  const variant = p.variant ?? 'pill'
  const current = tabs[active] ?? tabs[0] ?? {}
  const bullets: any[] = current.bullets ?? []

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" align="center" className="mb-10" />}

      <div className={cn('mx-auto mb-10 flex w-fit flex-wrap items-center justify-center gap-1', variant === 'segmented' && 'rounded-2xl border border-ink-200 bg-white p-1 shadow-soft')}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (ctx.mode === 'edit') {
                ctx.select(block.id, `tab.${i}`)
                return
              }
              setActive(i)
            }}
            className={cn(
              'rounded-xl px-4 py-2.5 text-[13.5px] font-bold transition',
              active === i
                ? variant === 'underline'
                  ? 'border-b-2 border-brand-600 text-brand-700'
                  : 'bg-brand-600 text-white shadow-soft'
                : 'text-ink-500 hover:bg-ink-100 hover:text-ink-800',
              ctx.selection?.elementKey === `tab.${i}` && 'outline outline-2 outline-brand-500',
            )}
          >
            <Editable k={`tab.${i}.label`} field={`tabs.${i}.label`} as="span" affordance={false} />
          </button>
        ))}
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Editable k="tab.heading" field={`tabs.${active}.heading`} as="h3" className="font-display text-2xl font-extrabold tracking-tight text-ink-950 lg:text-3xl" />
          <Editable k="tab.body" field={`tabs.${active}.body`} as="p" className="text-[15px] leading-relaxed text-ink-600" />
          {bullets.length > 0 && (
            <ul className="grid gap-2.5">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[14.5px] font-medium text-ink-700">
                  <Ic n='CheckCircle2' size={17} className="text-brand-600" />
                  <Editable k={`tab.bullet.${i}`} field={`tabs.${active}.bullets.${i}`} as="span" affordance={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <Element k="tab.media">
          <div className="overflow-hidden rounded-[26px] border border-white/60 bg-white/60 p-2.5 shadow-lift backdrop-blur">
            <ImageBox src={current.image} ratio="4/3" rounded="rounded-[20px]" />
          </div>
        </Element>
      </div>
    </Section>
  )
}

const GRID_COLS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
}

export function FeatureGridRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const items: any[] = p.items ?? []
  const variant = p.variant ?? 'card'
  const cols = GRID_COLS[p.columns ?? 3] ?? GRID_COLS[3]

  const cardClass = cn(
    'group/card relative flex flex-col gap-4 p-7 transition-all duration-300',
    variant === 'card' && 'rounded-2xl border border-ink-200/70 bg-white shadow-soft hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-lift',
    variant === 'bordered' && 'rounded-2xl border border-ink-200 bg-white hover:border-brand-300 hover:shadow-soft',
    variant === 'glass' && 'rounded-2xl border border-white/60 bg-white/60 shadow-soft backdrop-blur-xl hover:-translate-y-1.5 hover:bg-white/80',
    variant === 'bare' && 'p-0',
  )

  return (
    <Section>
      {(p.heading || p.eyebrow) && (
        <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-12" />
      )}
      <div className={cn('grid gap-6', cols, variant === 'spotlight' && 'lg:grid-cols-3')}>
        {items.map((item, i) => {
          const Icon = resolveIcon(item.icon)
          const spotlight = variant === 'spotlight' && i === 0
          return (
            <EditableItem key={i} k="items" index={i} className={cn(cardClass, spotlight && 'sm:col-span-2 lg:col-span-1 lg:row-span-2 lg:justify-center')}>
              {item.image ? (
                <ImageBox src={item.image} ratio="16/10" rounded="rounded-xl" />
              ) : (
                <IconBadge icon={item.icon} tone={spotlight ? 'brand' : 'soft'} size={spotlight ? 26 : 22} />
              )}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Editable k={`item.${i}.title`} field={`items.${i}.title`} as="h3" className={cn('font-display font-bold tracking-tight text-ink-950', spotlight ? 'text-2xl' : 'text-[17px]')} affordance={false} />
                  {item.badge && tr(item.badge, lang) && (
                    <Editable k={`item.${i}.badge`} field={`items.${i}.badge`} as="span" className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-700" affordance={false} />
                  )}
                </div>
                <Editable k={`item.${i}.text`} field={`items.${i}.text`} as="p" className={cn('leading-relaxed text-ink-600', spotlight ? 'text-[15px]' : 'text-[14px]')} affordance={false} />
              </div>
              {item.href && (
                <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-[13px] font-bold text-brand-600 transition group-hover/card:gap-2.5">
                  Learn more
                  <Ic n='ArrowRight' size={14} className={cn(ctx.dir === 'rtl' && 'rotate-180')} />
                </span>
              )}
            </EditableItem>
          )
        })}
      </div>
    </Section>
  )
}

export function GalleryRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const items: any[] = p.items ?? []
  const layout = p.layout ?? 'masonry'
  const [lightbox, setLightbox] = React.useState<number | null>(null)

  const cols = GRID_COLS[p.columns ?? 3] ?? GRID_COLS[3]

  return (
    <Section>
      {(p.heading || p.eyebrow) && (
        <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-12" />
      )}

      {layout === 'carousel' ? (
        <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 scrollbar-none">
          {items.map((item, i) => (
            <EditableItem key={i} k="items" index={i} className="group relative w-[300px] shrink-0 snap-start sm:w-[380px]">
              <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-soft">
                <ImageBox src={item.image} ratio="4/3" rounded="rounded-none" />
                <div className="p-4">
                  <Editable k={`item.${i}.title`} field={`items.${i}.title`} as="p" className="font-display text-[15px] font-bold text-ink-950" affordance={false} />
                  <Editable k={`item.${i}.tag`} field={`items.${i}.tag`} as="span" className="mt-1 block text-[12px] font-semibold uppercase tracking-wide text-brand-600" affordance={false} />
                </div>
              </div>
            </EditableItem>
          ))}
        </div>
      ) : (
        <div className={cn('grid gap-4', cols, layout === 'masonry' && 'auto-rows-[minmax(0,1fr)]')}>
          {items.map((item, i) => (
            <EditableItem
              key={i}
              k="items"
              field="items"
              index={i}
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-2xl border border-ink-200/60 bg-ink-100 shadow-soft',
                layout === 'masonry' && (i % 5 === 0 ? 'sm:row-span-2' : ''),
              )}
            >
              <div onClick={() => ctx.mode !== 'edit' && setLightbox(i)} className="h-full w-full">
                <ImageBox src={item.image} ratio={layout === 'masonry' && i % 5 === 0 ? '3/4' : '4/3'} rounded="rounded-none" className="h-full w-full" />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-ink-950/90 via-ink-950/40 to-transparent p-4 pt-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <Editable k={`item.${i}.title`} field={`items.${i}.title`} as="p" className="font-display text-[15px] font-bold text-white" affordance={false} />
                <Editable k={`item.${i}.tag`} field={`items.${i}.tag`} as="span" className="text-[11.5px] font-semibold uppercase tracking-wide text-white/70" affordance={false} />
              </div>
            </EditableItem>
          ))}
        </div>
      )}

      {lightbox !== null && items[lightbox] && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/90 p-6 backdrop-blur" onClick={() => setLightbox(null)}>
          <img src={items[lightbox].image} alt="" className="max-h-[86vh] max-w-[92vw] rounded-2xl object-contain shadow-lift" />
          <button type="button" className="absolute end-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" onClick={() => setLightbox(null)}>
            <Ic n='X' size={20} />
          </button>
        </div>
      )}
    </Section>
  )
}
