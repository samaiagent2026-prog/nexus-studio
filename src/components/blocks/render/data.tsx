import React from 'react'
import { resolveIcon, Ic } from '../../../lib/icons'
import { cn, formatDate, tr } from '../../../lib/utils'
import { Avatar, Card, Container, Editable, EditableItem, Element, IconBadge, ImageBox, KitButton, PriceTag, Section, SectionHeading, Stars } from '../kit'
import { useBlockCtx } from '../context'
import { t } from '../../../lib/i18n'

/* ============================================================
   Collection-driven blocks: listing grid, booking, team,
   testimonials, pricing, accordion.
   ============================================================ */

const GRID: Record<number, string> = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }
const headingAlign = (a?: string) => (a === 'center' ? 'center' : a === 'right' ? 'right' : 'left')

export function ListingGridRenderer() {
  const ctx = useBlockCtx()
  const { lang, block } = ctx
  const p = block.props
  const records = ctx.records(p.collection ?? 'properties').slice(0, p.limit ?? 6)
  const variant = p.variant ?? 'property'
  const cols = GRID[p.columns ?? 3] ?? GRID[3]
  const [filter, setFilter] = React.useState(0)
  const filters: any[] = p.filters ?? []

  const meta = (r: any) => {
    if (variant === 'property') {
      return [
        r.beds != null && { icon: 'Bed', value: `${r.beds}` },
        r.baths != null && { icon: 'Bath', value: `${r.baths}` },
        r.area != null && { icon: 'Ruler', value: new Intl.NumberFormat('en-US').format(r.area) },
      ].filter(Boolean)
    }
    if (variant === 'product') return []
    return []
  }

  return (
    <Section>
      {(p.heading || p.eyebrow) && (
        <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-10" />
      )}

      {p.showFilters && filters.length > 0 && (
        <Element k="filters" className={cn('mb-8 flex flex-wrap gap-2', p.align === 'center' && 'justify-center')}>
          {filters.map((f, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (ctx.mode === 'edit') {
                  ctx.select(block.id, `filter.${i}`)
                  return
                }
                setFilter(i)
              }}
              className={cn(
                'rounded-full border px-4 py-2 text-[13px] font-bold transition',
                filter === i ? 'border-brand-600 bg-brand-600 text-white shadow-soft' : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700',
                ctx.selection?.elementKey === `filter.${i}` && 'outline outline-2 outline-brand-500',
              )}
            >
              <Editable k={`filter.${i}`} field={`filters.${i}.label`} as="span" affordance={false} />
            </button>
          ))}
        </Element>
      )}

      <div className={cn('grid gap-6', cols)}>
        {records.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-ink-300 bg-[var(--surface-2)] p-10 text-center">
            <Ic n='Boxes' size={28} className="mx-auto text-ink-400" />
            <p className="mt-3 text-sm font-semibold text-ink-600">{t(ctx.lang, 'noRecordsYet')} “{p.collection}”. {t(ctx.lang, 'addFromAdmin')}</p>
          </div>
        )}
        {records.map((r, i) => (
          <EditableItem key={i} k="items" index={i} className="h-full">
            {variant === 'product' ? (
              <Card className="group">
                <div className="relative">
                  <ImageBox src={r.image} ratio="1/1" rounded="rounded-none" />
                  {r.badge && tr(r.badge, lang) && (
                    <span className="absolute start-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white shadow-soft">
                      {tr(r.badge, lang)}
                    </span>
                  )}
                  {r.stock === false && (
                    <span className="absolute end-3 top-3 rounded-full bg-ink-950/85 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white">
                      Sold out
                    </span>
                  )}
                  <button type="button" onClick={(e) => e.stopPropagation()} className="absolute bottom-3 end-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-800 opacity-0 shadow-lift transition group-hover:opacity-100">
                    <Ic n='Heart' size={17} />
                  </button>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5">
                  <span className="text-[11.5px] font-bold uppercase tracking-wide text-brand-600">{tr(r.category, lang) || tr(r.brand, lang)}</span>
                  <Editable k={`item.${i}.title`} as="h3" className="font-display text-[16px] font-bold leading-snug text-ink-950" affordance={false} fallback={tr(r.title, lang)} />
                  {p.showRating && r.rating && (
                    <span className="flex items-center gap-1.5">
                      <Stars rating={r.rating} size={13} />
                      <span className="text-[12px] font-medium text-ink-500">({r.reviews ?? 0})</span>
                    </span>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                    <div className="flex flex-col">
                      {p.showPrice && <PriceTag value={r.price} lang={lang} />}
                      {r.compareAt?.amount > 0 && (
                        <span className="text-[12px] font-medium text-ink-400 line-through">
                          {r.compareAt.currency === 'USD' ? '$' : ''}
                          {new Intl.NumberFormat('en-US').format(r.compareAt.amount)}
                        </span>
                      )}
                    </div>
                    {p.showCta && (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition group-hover:bg-brand-700">
                        <Ic n='ShoppingCart' size={17} />
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ) : variant === 'service' ? (
              <Card className="p-6">
                <IconBadge icon={r.icon ?? 'Sparkles'} tone="soft" />
                <Editable k={`item.${i}.title`} as="h3" className="mt-4 font-display text-[17px] font-bold text-ink-950" affordance={false} fallback={tr(r.title, lang)} />
                <Editable k={`item.${i}.summary`} as="p" className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-600" affordance={false} fallback={tr(r.summary, lang)} />
                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500">
                    <Ic n='Clock' size={14} />
                    {tr(r.duration, lang)}
                  </span>
                  {p.showPrice && <PriceTag value={r.price} lang={lang} size="md" />}
                </div>
                {p.showCta && (
                  <div className="mt-4">
                    <KitButton k={`item.${i}.cta`} field="ctaLabel" href={p.ctaHref} variant="outline" size="md" className="w-full" />
                  </div>
                )}
              </Card>
            ) : (
              <Card className="group">
                <div className="relative">
                  <ImageBox src={r.image} ratio="4/3" rounded="rounded-none" />
                  <span className="absolute start-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-ink-800 shadow-soft backdrop-blur">
                    {tr(r.status, lang)}
                  </span>
                  {r.featured && (
                    <span className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white shadow-soft">
                      <Ic n='Star' size={11} className="fill-white" />
                      {lang === 'ar' ? 'مميز' : 'Featured'}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Editable k={`item.${i}.title`} as="h3" className="truncate font-display text-[16.5px] font-bold text-ink-950" affordance={false} fallback={tr(r.title, lang)} />
                      <span className="mt-1 flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500">
                        <Ic n='MapPin' size={13} />
                        {tr(r.city, lang)}
                      </span>
                    </div>
                    {p.showPrice && <PriceTag value={r.price} lang={lang} />}
                  </div>

                  {meta(r).length > 0 && (
                    <div className="flex items-center gap-4 border-y border-[var(--border)] py-3">
                      {meta(r).map((m: any, mi: number) => {
                        const Icon = resolveIcon(m.icon)
                        return (
                          <span key={mi} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-600">
                            <Icon size={14} className="text-brand-600" />
                            {m.value}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <p className="line-clamp-2 text-[13.5px] leading-relaxed text-ink-500">{tr(r.description, lang)}</p>

                  {p.showCta && (
                    <div className="mt-auto pt-1">
                      <KitButton k={`item.${i}.cta`} field="ctaLabel" href={p.ctaHref} variant="secondary" size="md" iconRight="ArrowRight" className="w-full" />
                    </div>
                  )}
                </div>
              </Card>
            )}
          </EditableItem>
        ))}
      </div>

      {p.bottomCta?.label && tr(p.bottomCta.label, lang) && (
        <div className={cn('mt-10 flex', p.align === 'center' ? 'justify-center' : 'justify-start')}>
          <KitButton k="bottomCta.button" field="bottomCta.label" href={p.bottomCta.href} icon={p.bottomCta.icon} iconRight="ArrowRight" variant={p.bottomCta.variant ?? 'outline'} size="lg" />
        </div>
      )}
    </Section>
  )
}

export function BookingRenderer() {
  const ctx = useBlockCtx()
  const { lang, block } = ctx
  const p = block.props
  const practitioners = ctx.records(p.collection ?? 'doctors').slice(0, p.limit ?? 4)
  const [selected, setSelected] = React.useState(0)
  const [day, setDay] = React.useState(1)
  const [slot, setSlot] = React.useState<string | null>(null)
  const [confirmed, setConfirmed] = React.useState(false)
  const days = p.days ?? 7
  const slots: string[] = p.slots ?? []
  const person = practitioners[selected]

  const dayList = React.useMemo(
    () =>
      Array.from({ length: days }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d
      }),
    [days],
  )

  return (
    <Section>
      <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={p.align === 'left' ? 'left' : 'center'} className="mb-10" />

      <Element k="widget" className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-ink-200/70 bg-white shadow-lift">
        <div className="grid lg:grid-cols-[1.05fr_1.4fr]">
          {/* practitioner picker */}
          <div className="border-b border-[var(--border)] bg-[var(--surface-2)] p-6 lg:border-b-0 lg:border-e">
            <h3 className="mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink-400">1 · {lang === 'ar' ? 'اختر مختصاً' : 'Choose a specialist'}</h3>
            <div className="flex flex-col gap-2">
              {practitioners.map((doc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (ctx.mode === 'edit') return
                    setSelected(i)
                    setConfirmed(false)
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-3 text-start transition',
                    selected === i ? 'border-brand-500 bg-white shadow-soft ring-1 ring-brand-500/20' : 'border-transparent bg-white/60 hover:border-ink-200 hover:bg-white',
                  )}
                >
                  <Avatar src={doc.photo} name={tr(doc.name, lang)} size={46} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-ink-950">{tr(doc.name, lang)}</p>
                    <p className="truncate text-[12.5px] font-medium text-brand-600">{tr(doc.speciality ?? doc.role, lang)}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-500">
                      <Stars rating={doc.rating ?? 5} size={11} />
                      {doc.experience ? `${doc.experience} yrs` : tr(doc.clinic, lang)}
                    </p>
                  </div>
                  {doc.available === false ? (
                    <span className="shrink-0 rounded-full bg-ink-200 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-600">{t(ctx.lang, 'full')}</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">{t(ctx.lang, 'available')}</span>
                  )}
                </button>
              ))}
              {practitioners.length === 0 && <p className="text-sm text-ink-500">{t(ctx.lang, 'addSpecialists')}</p>}
            </div>

            {p.showInsurance && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50 p-3.5">
                <Ic n='Shield' size={17} className="mt-0.5 shrink-0 text-brand-600" />
                <Editable k="insuranceText" field="insuranceText" as="p" className="text-[12.5px] font-medium leading-snug text-brand-800" />
              </div>
            )}
          </div>

          {/* scheduler */}
          <div className="p-6">
            <h3 className="mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-ink-400">2 · {lang === 'ar' ? 'اختر التاريخ والوقت' : 'Pick a date & time'}</h3>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 scrollbar-none">
              {dayList.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (ctx.mode === 'edit') return
                    setDay(i)
                    setConfirmed(false)
                  }}
                  className={cn(
                    'flex w-[64px] shrink-0 flex-col items-center gap-0.5 rounded-2xl border px-2 py-3 transition',
                    day === i ? 'border-brand-600 bg-brand-600 text-white shadow-soft' : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300',
                  )}
                >
                  <span className="text-[10.5px] font-bold uppercase tracking-wide opacity-70">
                    {d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' })}
                  </span>
                  <span className="font-display text-lg font-extrabold leading-none">{d.getDate()}</span>
                  <span className="text-[10.5px] font-semibold opacity-70">{d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' })}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((s, i) => {
                const taken = i % 5 === 3
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={taken}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (ctx.mode === 'edit') return
                      setSlot(s)
                      setConfirmed(false)
                    }}
                    className={cn(
                      'rounded-xl border px-2 py-2.5 text-[13px] font-bold tabular-nums transition',
                      taken
                        ? 'cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300 line-through'
                        : slot === s
                          ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
                          : 'border-ink-200 bg-white text-ink-700 hover:border-brand-400 hover:text-brand-700',
                    )}
                  >
                    {s}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {person ? (
                  <>
                    <p className="truncate text-[13.5px] font-bold text-ink-900">{tr(person.name, lang)}</p>
                    <p className="text-[12.5px] text-ink-500">
                      {dayList[day]?.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })} · {slot ?? '—'}
                    </p>
                  </>
                ) : (
                  <p className="text-[13px] text-ink-500">{lang === 'ar' ? 'اختر مختصاً' : 'Select a specialist'}</p>
                )}
                {p.showFee && person?.fee?.amount ? <p className="mt-1 text-[12px] font-semibold text-brand-700">Fee {person.fee.currency ?? ''} {person.fee.amount}</p> : null}
              </div>
              <KitButton k="submit" field="submitLabel" variant="primary" size="lg" onClick={(e: any) => {
                e.stopPropagation()
                if (ctx.mode === 'edit' || !slot) return
                setConfirmed(true)
              }} />
            </div>

            {confirmed && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-800">
                <Ic n='CheckCircle2' size={17} />
                {t(ctx.lang, 'appointmentReserved')}
              </div>
            )}

            <Editable k="note" field="noteText" as="p" className="mt-4 text-center text-[12px] text-ink-400" />
          </div>
        </div>
      </Element>
    </Section>
  )
}

export function TeamRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const people = ctx.records(p.collection ?? 'team').slice(0, p.limit ?? 4)
  const variant = p.variant ?? 'card'
  const cols = GRID[p.columns ?? 4] ?? GRID[4]

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-12" />}
      <div className={cn('grid gap-6', cols)}>
        {people.map((person, i) => (
          <EditableItem key={i} k="items" index={i} className={cn('group', variant === 'banner' && 'sm:col-span-2')}>
            {variant === 'circle' ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <Avatar src={person.photo} name={tr(person.name, lang)} size={112} className="ring-4 ring-white shadow-lift" />
                <div>
                  <Editable k={`item.${i}.name`} as="h3" className="font-display text-[16.5px] font-bold text-ink-950" affordance={false} fallback={tr(person.name, lang)} />
                  <Editable k={`item.${i}.role`} as="p" className="text-[13px] font-semibold text-brand-600" affordance={false} fallback={tr(person.role, lang)} />
                </div>
                {p.showSocials && (
                  <div className="flex gap-2">
                    {['Linkedin', 'Mail'].map((ic) => {
                      const Icon = resolveIcon(ic)
                      return (
                        <span key={ic} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition hover:border-brand-300 hover:text-brand-600">
                          <Icon size={15} />
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <Card className="overflow-hidden">
                <div className="relative">
                  <ImageBox src={person.photo} ratio={variant === 'banner' ? '16/7' : '4/5'} rounded="rounded-none" />
                  {p.showSocials && (
                    <div className="absolute inset-x-0 bottom-0 flex translate-y-3 justify-center gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      {['Linkedin', 'Mail', 'Globe'].map((ic) => {
                        const Icon = resolveIcon(ic)
                        return (
                          <span key={ic} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-lift backdrop-blur">
                            <Icon size={15} />
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-5">
                  <Editable k={`item.${i}.name`} as="h3" className="font-display text-[16px] font-bold text-ink-950" affordance={false} fallback={tr(person.name, lang)} />
                  <Editable k={`item.${i}.role`} as="p" className="text-[13px] font-semibold text-brand-600" affordance={false} fallback={tr(person.role, lang)} />
                  {p.showBio && person.bio && (
                    <Editable k={`item.${i}.bio`} as="p" className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500" affordance={false} fallback={tr(person.bio, lang)} />
                  )}
                </div>
              </Card>
            )}
          </EditableItem>
        ))}
      </div>
    </Section>
  )
}

export function TestimonialsRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const items = ctx.records(p.collection ?? 'testimonials').slice(0, p.limit ?? 6)
  const variant = p.variant ?? 'grid'
  const cols = GRID[p.columns ?? 3] ?? GRID[3]

  const QuoteCard = ({ item, i, featured }: { item: any; i: number; featured?: boolean }) => (
    <EditableItem key={i} k="items" index={i} className={cn('h-full', featured && 'lg:col-span-2')}>
      <Card className={cn('gap-5 p-7', featured && 'bg-gradient-to-br from-brand-600 to-brand-700 text-white')}>
        <div className="flex items-center justify-between">
          <Ic n='Quote' size={featured ? 34 : 26} className={featured ? 'text-white/40' : 'text-brand-200'} />
          {p.showRating && <Stars rating={item.rating ?? 5} size={featured ? 17 : 14} />}
        </div>
        <Editable
          k={`item.${i}.quote`}
          fallback={tr(item.quote, lang)}
          as="blockquote"
          className={cn('flex-1 font-display leading-snug', featured ? 'text-xl font-semibold text-white' : 'text-[15.5px] font-medium text-ink-800')}
          affordance={false}
        />
        <div className="flex items-center gap-3 border-t pt-5" style={{ borderColor: featured ? 'rgba(255,255,255,.2)' : 'var(--border)' }}>
          <Avatar src={item.avatar} name={tr(item.name, lang)} size={44} />
          <div className="min-w-0">
            <Editable k={`item.${i}.name`} as="p" className={cn('truncate text-[14px] font-bold', featured ? 'text-white' : 'text-ink-950')} affordance={false} fallback={tr(item.name, lang)} />
            <p className={cn('truncate text-[12.5px]', featured ? 'text-white/70' : 'text-ink-500')}>
              {tr(item.role, lang)}{item.company ? ` · ${tr(item.company, lang)}` : ''}
            </p>
          </div>
        </div>
      </Card>
    </EditableItem>
  )

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-12" />}

      {variant === 'spotlight' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {items.slice(0, 2).map((item, i) => <QuoteCard key={i} item={item} i={i} featured={i === 0} />)}
          <div className={cn('grid gap-6 sm:grid-cols-2 lg:col-span-2', GRID[2])}>
            {items.slice(2, 4).map((item, i) => <QuoteCard key={i} item={item} i={i + 2} />)}
          </div>
        </div>
      ) : variant === 'slider' ? (
        <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 scrollbar-none">
          {items.map((item, i) => (
            <div key={i} className="w-[320px] shrink-0 snap-start sm:w-[380px]">
              <QuoteCard item={item} i={i} />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn('grid gap-6', cols)}>
          {items.map((item, i) => <QuoteCard key={i} item={item} i={i} />)}
        </div>
      )}
    </Section>
  )
}

export function PricingRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const plans = ctx.records(p.collection ?? 'pricing').slice(0, p.limit ?? 3)
  const [yearly, setYearly] = React.useState(false)
  const toggleLabels: any[] = p.toggleLabels ?? []

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-8" />}

      {p.toggleOn && (
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-2xl border border-ink-200 bg-white p-1 shadow-soft">
            {[false, true].map((val, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (ctx.mode === 'edit') {
                    ctx.select(ctx.block.id, `toggle.${i}`)
                    return
                  }
                  setYearly(val)
                }}
                className={cn(
                  'rounded-xl px-4 py-2 text-[13px] font-bold transition',
                  yearly === val ? 'bg-brand-600 text-white shadow-soft' : 'text-ink-500 hover:text-ink-800',
                  ctx.selection?.elementKey === `toggle.${i}` && 'outline outline-2 outline-brand-500',
                )}
              >
                <Editable k={`toggle.${i}`} field={`toggleLabels.${i}.text`} as="span" affordance={false} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cn('grid items-start gap-6', plans.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : 'lg:grid-cols-3')}>
        {plans.map((plan, i) => {
          const highlight = !!plan.highlight
          const price = plan.price?.amount ?? 0
          const display = yearly && price > 0 ? Math.round(price * 0.8) : price
          const features: any[] = plan.features ?? []
          return (
            <EditableItem key={i} k="items" index={i} className="h-full">
              <Card
                className={cn(
                  'gap-6 p-7',
                  highlight && 'border-brand-600 shadow-lift lg:-translate-y-3 lg:scale-[1.02]',
                )}
              >
                {highlight && (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-white shadow-soft rtl:translate-x-1/2">
                    Most popular
                  </span>
                )}
                <div>
                  <Editable k={`item.${i}.name`} as="h3" className="font-display text-lg font-extrabold text-ink-950" affordance={false} fallback={tr(plan.name, lang)} />
                  <Editable k={`item.${i}.tagline`} as="p" className="mt-1 text-[13.5px] text-ink-500" affordance={false} fallback={tr(plan.tagline, lang)} />
                </div>
                <div className="flex items-end gap-1.5">
                  <PriceTag value={{ ...plan.price, amount: display }} lang={lang} size="lg" />
                  <Editable k={`item.${i}.period`} as="span" className="pb-1.5 text-[13px] font-medium text-ink-500" affordance={false} fallback={tr(plan.period, lang)} />
                </div>
                <ul className="flex flex-1 flex-col gap-3 border-t border-[var(--border)] pt-6">
                  {features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5">
                      <span className={cn('mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full', highlight ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700')}>
                        <Ic n='Check' size={12} strokeWidth={3} />
                      </span>
                      <Editable k={`item.${i}.feature.${fi}`} as="span" className="text-[14px] font-medium text-ink-700" affordance={false} fallback={tr(f, lang)} />
                    </li>
                  ))}
                </ul>
                <KitButton
                  k={`item.${i}.cta`}
                  field={`items.${i}.cta`}
                  variant={highlight ? 'primary' : 'outline'}
                  size="lg"
                  className="w-full"
                  iconRight="ArrowRight"
                />
              </Card>
            </EditableItem>
          )
        })}
      </div>

      {p.footnote && (
        <Editable k="footnote" field="footnote" as="p" className="mt-8 text-center text-[12.5px] text-ink-400" />
      )}
    </Section>
  )
}

export function AccordionRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const bound = ctx.records(p.collection ?? 'faq')
  const items: any[] = (bound.length ? bound : p.items ?? []).slice(0, p.limit ?? 6)
  const [open, setOpen] = React.useState<number | null>(0)
  const layout = p.layout ?? 'split'

  const list = (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = open === i
        const q = item.question ?? item.title
        const a = item.answer ?? item.text
        return (
          <EditableItem key={i} k="items" index={i} className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-soft transition hover:border-brand-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (ctx.mode === 'edit') {
                  ctx.select(ctx.block.id, `items.${i}`)
                  return
                }
                setOpen(isOpen ? null : i)
              }}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <Editable
                k={`item.${i}.question`}
                field={bound.length ? undefined : `items.${i}.question`}
                as="span"
                className="font-display text-[15.5px] font-bold text-ink-950"
                affordance={false}
              >
                {tr(q, lang)}
              </Editable>
              <span className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300', isOpen ? 'rotate-180 bg-brand-600 text-white' : 'bg-ink-100 text-ink-600')}>
                <Ic n='ChevronDown' size={16} />
              </span>
            </button>
            <div className={cn('grid transition-all duration-300 ease-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
              <div className="overflow-hidden">
                <Editable
                  k={`item.${i}.answer`}
                  field={bound.length ? undefined : `items.${i}.answer`}
                  as="p"
                  className="px-5 pb-5 text-[14px] leading-relaxed text-ink-600"
                  affordance={false}
                >
                  {tr(a, lang)}
                </Editable>
              </div>
            </div>
          </EditableItem>
        )
      })}
    </div>
  )

  const contact = p.contactOn ? (
    <Element k="contact" className="flex flex-col gap-4 rounded-[26px] border border-brand-100 bg-brand-50 p-7">
      <IconBadge icon="MessagesSquare" tone="brand" />
      <Editable k="contact.title" field="contactTitle" as="h3" className="font-display text-xl font-extrabold text-ink-950" />
      <Editable k="contact.text" field="contactText" as="p" className="text-[14px] leading-relaxed text-ink-600" />
      <KitButton k="contact.cta.button" field="contactCta.label" href={p.contactCta?.href} variant="primary" size="lg" iconRight="ArrowRight" className="w-fit" />
    </Element>
  ) : null

  if (layout === 'split') {
    return (
      <Section>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
            <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align="left" />
            {contact}
          </div>
          {list}
        </div>
      </Section>
    )
  }

  return (
    <Section>
      <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-10" />
      <div className={cn(layout === 'two' ? 'grid gap-4 lg:grid-cols-2' : 'mx-auto max-w-3xl')}>{list}</div>
      {contact && <div className="mx-auto mt-10 max-w-3xl">{contact}</div>}
    </Section>
  )
}
