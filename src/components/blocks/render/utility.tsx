import React from 'react'
import { resolveIcon, Ic } from '../../../lib/icons'
import { cn, formatDate, getPath, tr } from '../../../lib/utils'
import { Avatar, Card, Container, Editable, EditableItem, Element, IconBadge, ImageBox, KitButton, PriceTag, Section, SectionHeading, Stars } from '../kit'
import { useBlockCtx } from '../context'
import { t } from '../../../lib/i18n'

/* ============================================================
   Utility / trust / editorial blocks.
   ============================================================ */

const GRID: Record<number, string> = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }
const headingAlign = (a?: string) => (a === 'center' ? 'center' : a === 'right' ? 'right' : 'left')

export function LogosRenderer() {
  const ctx = useBlockCtx()
  const p = ctx.block.props
  const logos: any[] = p.logos ?? []
  const row = (
    <div className="flex shrink-0 items-center gap-12 px-6">
      {logos.map((logo, i) => {
        const Icon = resolveIcon(logo.icon)
        return (
          <Element
            key={i}
            k={`logo.${i}`}
            as="div"
            className="flex shrink-0 items-center gap-2.5 text-ink-400 transition-colors hover:text-ink-700"
            onClick={(e: React.MouseEvent<HTMLElement>) => {
              if (ctx.mode === 'edit') {
                e.stopPropagation()
                ctx.select(ctx.block.id, `logo.${i}`)
              }
            }}
          >
            {logo.image ? (
              <img src={logo.image} alt={logo.name} className="h-8 w-auto max-w-[130px] object-contain opacity-70 grayscale" />
            ) : (
              <>
                <Icon size={24} strokeWidth={2} />
                <span className="font-display text-lg font-bold tracking-tight">{logo.name}</span>
              </>
            )}
          </Element>
        )
      })}
    </div>
  )

  return (
    <Section>
      {p.eyebrow && (
        <Editable k="eyebrow" field="eyebrow" as="p" className="mb-8 text-center text-[11.5px] font-bold uppercase tracking-[0.18em] text-ink-400" />
      )}
      <div className="relative overflow-hidden">
        {p.marquee ? (
          <div className="flex w-max animate-marquee items-center">
            {row}
            {row}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">{row}</div>
        )}
        <div className="pointer-events-none absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-[var(--surface)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-[var(--surface)] to-transparent" />
      </div>
    </Section>
  )
}

export function ContactRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const details: any[] = p.details ?? []
  const fields: any[] = p.fields ?? []
  const socials: any[] = p.socials ?? []
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (ctx.mode === 'edit') return
    const missing = fields.filter((f) => f.required && !values[f.key ?? f.label?.en])
    if (missing.length) {
      setError(`Please complete: ${missing.map((m) => tr(m.label, lang)).join(', ')}`)
      return
    }
    setError(null)
    setSent(true)
    setValues({})
  }

  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-7">
          {p.eyebrow && (
            <Element k="eyebrow" as="span" className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-700">
              <Editable k="eyebrow.text" field="eyebrow" as="span" />
            </Element>
          )}
          <Editable k="heading" field="heading" as="h2" className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-950 text-balance sm:text-4xl" />
          <Editable k="subheading" field="subheading" as="p" className="text-[15px] leading-relaxed text-ink-600" />

          <Element k="details" className="grid gap-4 sm:grid-cols-2">
            {details.map((d, i) => {
              const Icon = resolveIcon(d.icon)
              return (
                <EditableItem key={i} k="details" index={i} className="flex items-start gap-3.5 rounded-2xl border border-ink-200/70 bg-white p-4 shadow-soft">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <Editable k={`detail.${i}.label`} field={`details.${i}.label`} as="p" className="text-[11px] font-bold uppercase tracking-wide text-ink-400" affordance={false} />
                    <Editable k={`detail.${i}.value`} field={`details.${i}.value`} as="p" className="text-[14px] font-semibold text-ink-900" affordance={false} />
                  </div>
                </EditableItem>
              )
            })}
          </Element>

          {p.showSocials && socials.length > 0 && (
            <Element k="socials" className="flex items-center gap-2">
              {socials.map((s, i) => {
                const Icon = resolveIcon(s.icon)
                return (
                  <span key={i} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 text-ink-600 transition hover:border-brand-300 hover:text-brand-600">
                    <Icon size={17} />
                  </span>
                )
              })}
            </Element>
          )}

          {p.mapOn && (
            <Element k="map" className="overflow-hidden rounded-2xl border border-ink-200/70 shadow-soft">
              <iframe
                title={t(ctx.lang, 'map')}
                loading="lazy"
                className="h-[240px] w-full"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(p.mapQuery || 'Dubai')}&output=embed`}
              />
            </Element>
          )}
        </div>

        {p.formOn && (
          <Element k="form" className="rounded-[28px] border border-ink-200/70 bg-white p-7 shadow-lift lg:p-9">
            <form className="flex flex-col gap-5" onSubmit={submit}>
              {fields.map((f, i) => {
                const key = f.key ?? `field-${i}`
                const label = tr(f.label, lang)
                const required = !!f.required
                return (
                  <div key={key} className={cn(f.type === 'longtext' && 'sm:col-span-2')}>
                    <label className="mb-1.5 block text-[12.5px] font-bold text-ink-700">
                      {label} {required && <span className="text-rose-500">*</span>}
                    </label>
                    {f.type === 'longtext' ? (
                      <textarea
                        rows={4}
                        required={required}
                        value={values[key] ?? ''}
                        onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
                        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        className="field resize-none"
                        placeholder={label}
                      />
                    ) : f.type === 'select' ? (
                      <select
                        value={values[key] ?? ''}
                        onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
                        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        className="field cursor-pointer"
                      >
                        <option value="">{label}</option>
                        {(f.options ?? []).map((o: any, oi: number) => (
                          <option key={oi} value={tr(o, lang)}>{tr(o, lang)}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={required}
                        value={values[key] ?? ''}
                        onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
                        onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                        className="field"
                        placeholder={label}
                      />
                    )}
                  </div>
                )
              })}

              {error && (
                <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-rose-700">
                  <Ic n='AlertTriangle' size={15} />
                  {error}
                </p>
              )}

              {sent ? (
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <Ic n='CheckCircle2' size={19} className="mt-0.5 shrink-0 text-emerald-600" />
                  <Editable k="success" field="successMessage" as="p" className="text-[13.5px] font-medium leading-relaxed text-emerald-800" />
                </div>
              ) : (
                <KitButton k="submit.button" field="submitLabel" variant="primary" size="lg" icon="Send" className="w-full" />
              )}

              <Editable k="consent" field="consentText" as="p" className="text-center text-[11.5px] text-ink-400" />
            </form>
          </Element>
        )}
      </div>
    </Section>
  )
}

export function NewsletterRenderer() {
  const ctx = useBlockCtx()
  const p = ctx.block.props
  const benefits: any[] = p.benefits ?? []
  const [email, setEmail] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const variant = p.variant ?? 'panel'
  const dark = variant === 'dark' || variant === 'gradient'

  return (
    <Section>
      <Element
        k="panel"
        className={cn(
          'relative overflow-hidden rounded-[30px] px-7 py-12 sm:px-12',
          variant === 'panel' && 'border border-ink-200/70 bg-white shadow-lift',
          variant === 'dark' && 'bg-ink-950 text-white',
          variant === 'gradient' && 'bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 text-white',
          variant === 'bare' && '',
        )}
      >
        {(dark || variant === 'gradient') && <div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />}
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
          {p.eyebrow && (
            <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em]', dark ? 'bg-white/15 text-white' : 'bg-brand-50 text-brand-700')}>
              <Ic n='Send' size={12} />
              <Editable k="eyebrow.text" field="eyebrow" as="span" />
            </span>
          )}
          <Editable k="heading" field="heading" as="h2" className={cn('font-display text-3xl font-extrabold leading-tight tracking-tight text-balance sm:text-4xl', dark ? 'text-white' : 'text-ink-950')} />
          <Editable k="subheading" field="subheading" as="p" className={cn('max-w-xl text-[15px] leading-relaxed', dark ? 'text-white/75' : 'text-ink-600')} />

          <form
            className="mt-2 flex w-full max-w-lg flex-col gap-2.5 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              if (ctx.mode === 'edit') return
              setSent(true)
              setEmail('')
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
              placeholder={tr(p.placeholder, ctx.lang)}
              className={cn(
                'min-w-0 flex-1 rounded-xl px-4 py-3.5 text-sm font-medium outline-none transition',
                dark
                  ? 'border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-brand-300 focus:ring-4 focus:ring-white/10'
                  : 'border border-ink-200 bg-white text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10',
              )}
            />
            <KitButton k="submit.button" field="submitLabel" variant={dark ? 'dark' : 'primary'} size="lg" className={cn(dark && 'bg-white text-ink-950 hover:bg-white/90')} icon={sent ? 'Check' : 'ArrowRight'} />
          </form>

          {benefits.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {benefits.map((b, i) => (
                <span key={i} className={cn('inline-flex items-center gap-1.5 text-[12.5px] font-semibold', dark ? 'text-white/70' : 'text-ink-500')}>
                  <Ic n='Check' size={14} className={dark ? 'text-white' : 'text-brand-600'} strokeWidth={3} />
                  <Editable k={`benefit.${i}`} field={`benefits.${i}.text`} as="span" affordance={false} />
                </span>
              ))}
            </div>
          )}

          {p.noteText && (
            <Editable k="note" field="noteText" as="p" className={cn('text-[12px] font-medium', dark ? 'text-white/55' : 'text-ink-400')} />
          )}
        </div>
      </Element>
    </Section>
  )
}

export function MapLocationsRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const branches = ctx.records(p.collection ?? 'locations').slice(0, p.limit ?? 6)
  const [active, setActive] = React.useState(0)

  return (
    <Section>
      <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-10" />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-3">
          {branches.map((b, i) => (
            <EditableItem
              key={i}
              k="items"
              index={i}
              className={cn(
                'cursor-pointer rounded-2xl border p-5 transition',
                active === i ? 'border-brand-500 bg-white shadow-lift ring-1 ring-brand-500/20' : 'border-ink-200/70 bg-white/70 hover:border-brand-300 hover:bg-white',
              )}
              onClick={() => ctx.mode !== 'edit' && setActive(i)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Editable k={`item.${i}.name`} as="h3" className="font-display text-[16px] font-bold text-ink-950" affordance={false} fallback={tr(b.name, lang)} />
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-500">
                    <Ic n='MapPin' size={14} className="text-brand-600" />
                    {tr(b.address, lang)}
                  </p>
                  {p.showHours && b.hours && (
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-ink-500">
                      <Ic n='Clock' size={13} />
                      {tr(b.hours, lang)}
                    </p>
                  )}
                  {b.phone && (
                    <p className="mt-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-700">
                      <Ic n='Phone' size={13} />
                      {b.phone}
                    </p>
                  )}
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${tr(b.address, lang)} ${tr(b.city, lang)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
                  className="shrink-0 rounded-xl border border-ink-200 px-3 py-1.5 text-[12px] font-bold text-ink-700 transition hover:border-brand-300 hover:text-brand-700"
                >
                  {tr(p.directionsLabel, lang)}
                </a>
              </div>
            </EditableItem>
          ))}
        </div>

        {p.mapOn && (
          <Element k="map" className="overflow-hidden rounded-[26px] border border-ink-200/70 shadow-lift">
            <iframe
              title={t(ctx.lang, 'locationsMap')}
              loading="lazy"
              className="h-full min-h-[420px] w-full"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(tr(branches[active]?.address, lang) || p.mapQuery || 'Dubai')}&z=13&output=embed`}
            />
          </Element>
        )}
      </div>
    </Section>
  )
}

export function BlogRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const posts = ctx.records(p.collection ?? 'posts').slice(0, p.limit ?? 3)
  const variant = p.variant ?? 'card'
  const cols = GRID[p.columns ?? 3] ?? GRID[3]

  const card = (post: any, i: number, big?: boolean) => (
    <EditableItem key={i} k="items" index={i} className={cn('group h-full', big && 'lg:col-span-2')}>
      <Card className="overflow-hidden">
        <div className="relative">
          <ImageBox src={post.image} ratio={big ? '16/9' : '4/3'} rounded="rounded-none" />
          {p.showCategory && tr(post.category, lang) && (
            <span className="absolute start-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-brand-700 shadow-soft backdrop-blur">
              {tr(post.category, lang)}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2.5 p-5">
          <div className="flex items-center gap-3 text-[12px] font-medium text-ink-400">
            {post.date && <span>{formatDate(new Date(post.date).getTime(), lang)}</span>}
            {p.showReadTime && tr(post.readTime, lang) && <span className="flex items-center gap-1"><Ic n='Clock' size={12} />{tr(post.readTime, lang)}</span>}
          </div>
          <Editable k={`item.${i}.title`} as="h3" className={cn('font-display font-bold leading-snug text-ink-950 transition group-hover:text-brand-700', big ? 'text-xl' : 'text-[16px]')} affordance={false} fallback={tr(post.title, lang)} />
          <Editable k={`item.${i}.excerpt`} as="p" className="line-clamp-3 text-[13.5px] leading-relaxed text-ink-500" affordance={false} fallback={tr(post.excerpt, lang)} />
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="flex items-center gap-2">
              <Avatar src={undefined} name={tr(post.author, lang)} size={30} />
              <Editable k={`item.${i}.author`} as="span" className="text-[12.5px] font-semibold text-ink-600" affordance={false} fallback={tr(post.author, lang)} />
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600 transition group-hover:gap-2.5">
              {tr(p.ctaLabel, lang) || 'Read'}
              <Ic n='ArrowRight' size={14} className={cn(ctx.dir === 'rtl' && 'rotate-180')} />
            </span>
          </div>
        </div>
      </Card>
    </EditableItem>
  )

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-12" />}

      {variant === 'featured' && posts.length > 0 ? (
        <div className={cn('grid gap-6', cols)}>
          {card(posts[0], 0, true)}
          <div className="flex flex-col gap-4">
            {posts.slice(1, 3).map((post, i) => (
              <EditableItem key={i} k="items" index={i + 1} className="group flex gap-4">
                <div className="w-28 shrink-0 overflow-hidden rounded-xl">
                  <ImageBox src={post.image} ratio="1/1" rounded="rounded-none" />
                </div>
                <div className="min-w-0">
                  <Editable k={`item.${i + 1}.title`} as="h3" className="font-display text-[15px] font-bold leading-snug text-ink-950" affordance={false} fallback={tr(post.title, lang)} />
                  <Editable k={`item.${i + 1}.excerpt`} as="p" className="mt-1 line-clamp-2 text-[13px] text-ink-500" affordance={false} fallback={tr(post.excerpt, lang)} />
                </div>
              </EditableItem>
            ))}
          </div>
        </div>
      ) : variant === 'list' ? (
        <div className="flex flex-col divide-y divide-[var(--border)]">
          {posts.map((post, i) => (
            <EditableItem key={i} k="items" index={i} className="group flex flex-col gap-5 py-6 sm:flex-row sm:items-center">
              <div className="w-full shrink-0 overflow-hidden rounded-2xl sm:w-56">
                <ImageBox src={post.image} ratio="16/10" rounded="rounded-none" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11.5px] font-bold uppercase tracking-wide text-brand-600">{tr(post.category, lang)}</span>
                <Editable k={`item.${i}.title`} as="h3" className="mt-1 font-display text-xl font-bold text-ink-950" affordance={false} fallback={tr(post.title, lang)} />
                <Editable k={`item.${i}.excerpt`} as="p" className="mt-2 text-[14px] leading-relaxed text-ink-500" affordance={false} fallback={tr(post.excerpt, lang)} />
              </div>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-200 text-ink-600 transition group-hover:border-brand-400 group-hover:bg-brand-600 group-hover:text-white">
                <Ic n='ArrowRight' size={17} className={cn(ctx.dir === 'rtl' && 'rotate-180')} />
              </span>
            </EditableItem>
          ))}
        </div>
      ) : (
        <div className={cn('grid gap-6', cols)}>{posts.map((post, i) => card(post, i))}</div>
      )}

      {p.bottomCta?.label && tr(p.bottomCta.label, lang) && (
        <div className="mt-10 flex justify-center">
          <KitButton k="bottomCta.button" field="bottomCta.label" href={p.bottomCta.href} variant={p.bottomCta.variant ?? 'outline'} size="lg" iconRight="ArrowRight" />
        </div>
      )}
    </Section>
  )
}

const BANNER_HEIGHT: Record<string, string> = { sm: 'py-14 lg:py-20', md: 'py-20 lg:py-28', lg: 'py-28 lg:py-40', full: 'py-32 lg:py-52' }

export function BannerRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const align = p.align ?? 'left'

  return (
    <Section className="!px-0" contentClassName="!px-5 sm:!px-6 lg:!px-8">
      <div className="absolute inset-0">
        <ImageBox src={p.image} ratio="16/9" rounded="rounded-none" className="h-full min-h-full w-full" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(105deg, rgba(9,12,24,${(p.overlay ?? 0.55) + 0.15}) 0%, rgba(9,12,24,${p.overlay ?? 0.55}) 60%, rgba(9,12,24,${Math.max(0.15, (p.overlay ?? 0.55) - 0.25)}) 100%)` }} />
      </div>
      <div className={cn('relative flex flex-col gap-6', BANNER_HEIGHT[p.height ?? 'lg'] ?? BANNER_HEIGHT.lg, align === 'center' && 'items-center text-center')}>
        <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
          {p.eyebrow && (
            <Element k="eyebrow" as="span" className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur">
              <Ic n='Flame' size={13} />
              <Editable k="eyebrow.text" field="eyebrow" as="span" />
            </Element>
          )}
          <Editable k="heading" field="heading" as="h2" className="font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white text-balance sm:text-4xl lg:text-[3rem]" />
          <Editable k="subheading" field="subheading" as="p" className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/75 text-pretty sm:text-lg" />
          <div className={cn('mt-7 flex flex-wrap gap-3', align === 'center' && 'justify-center')}>
            {p.primaryCta?.label && tr(p.primaryCta.label, lang) && (
              <KitButton k="primaryCta.button" field="primaryCta.label" href={p.primaryCta.href} icon={p.primaryCta.icon} iconRight="ArrowRight" variant={p.primaryCta.variant ?? 'primary'} size="lg" />
            )}
            {p.secondaryCta?.label && tr(p.secondaryCta.label, lang) && (
              <KitButton k="secondaryCta.button" field="secondaryCta.label" href={p.secondaryCta.href} icon={p.secondaryCta.icon} variant={p.secondaryCta.variant ?? 'glass'} size="lg" />
            )}
          </div>
        </div>

        {p.floatingBadgeOn && (
          <Element k="badge" className="absolute bottom-6 end-6 flex flex-col rounded-2xl border border-white/25 bg-white/10 px-5 py-3.5 text-white backdrop-blur-xl">
            <span className="font-display text-2xl font-extrabold leading-none">{p.floatingBadge?.value}</span>
            <Editable k="badge.label" field="floatingBadge.label" as="span" className="mt-1 text-[11.5px] font-semibold text-white/70" />
          </Element>
        )}
      </div>
    </Section>
  )
}

export function TableRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const columns: any[] = p.columns ?? []
  const rows: any[] = p.rows ?? []

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-10" />}
      <Element k="table" className="overflow-x-auto rounded-[26px] border border-ink-200/70 bg-white shadow-lift">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="border-b border-[var(--border)] bg-[var(--surface-2)] p-5 text-start text-[12px] font-bold uppercase tracking-wide text-ink-400">{t(ctx.lang, 'feature')}</th>
              {columns.map((c, i) => (
                <th
                  key={i}
                  data-el={`col.${i}`}
                  onClick={(e) => {
                    if (ctx.mode === 'edit') {
                      e.stopPropagation()
                      ctx.select(ctx.block.id, `col.${i}`)
                    }
                  }}
                  className={cn(
                    'border-b border-[var(--border)] p-5 text-center font-display text-[15px] font-extrabold text-ink-950',
                    c.highlight ? 'bg-brand-50 text-brand-800' : 'bg-[var(--surface-2)]',
                    ctx.selection?.elementKey === `col.${i}` && 'outline outline-2 outline-brand-500',
                  )}
                >
                  <Editable k={`col.${i}.label`} field={`columns.${i}.label`} as="span" affordance={false} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="transition hover:bg-[var(--surface-2)]">
                <td className="border-b border-[var(--border)] p-5 text-[14px] font-semibold text-ink-800">
                  <Editable k={`row.${ri}.label`} field={`rows.${ri}.label`} as="span" affordance={false} />
                </td>
                {columns.map((c, ci) => {
                  const val = (row.values ?? [])[ci]
                  const isYes = String(val).toLowerCase() === 'yes'
                  const isNo = String(val).trim() === '—' || String(val).trim() === '-'
                  return (
                    <td key={ci} className={cn('border-b border-[var(--border)] p-5 text-center text-[14px]', c.highlight && 'bg-brand-50/60')}>
                      {isYes ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Ic n='Check' size={15} strokeWidth={3} />
                        </span>
                      ) : isNo ? (
                        <span className="text-ink-300">—</span>
                      ) : (
                        <Editable k={`row.${ri}.v${ci}`} field={`rows.${ri}.values.${ci}`} valueKind="plain" as="span" className="font-semibold text-ink-700" affordance={false} />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            {p.ctaRow && (
              <tr>
                <td className="p-5" />
                {columns.map((c, ci) => (
                  <td key={ci} className={cn('p-5 text-center', c.highlight && 'bg-brand-50/60')}>
                    <KitButton k={`col.${ci}.cta`} field="ctaLabel" variant={c.highlight ? 'primary' : 'outline'} size="md" />
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </Element>
      {p.footnote && <Editable k="footnote" field="footnote" as="p" className="mt-5 text-center text-[12.5px] text-ink-400" />}
    </Section>
  )
}

export function VideoRenderer() {
  const ctx = useBlockCtx()
  const p = ctx.block.props
  const [playing, setPlaying] = React.useState(false)
  const stats: any[] = p.stats ?? []
  const variant = p.variant ?? 'poster'

  const player = (
    <Element k="media" className="relative overflow-hidden rounded-[26px] border border-ink-200/70 bg-ink-950 shadow-lift">
      {playing ? (
        <iframe title={t(ctx.lang, 'video')} className="aspect-video w-full" src={`${p.embedUrl}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (ctx.mode === 'edit') return
            setPlaying(true)
          }}
          className="group relative block w-full"
        >
          <ImageBox src={p.poster} ratio="16/9" rounded="rounded-none" />
          <span className="absolute inset-0 flex items-center justify-center bg-ink-950/25 transition group-hover:bg-ink-950/40">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-lift transition group-hover:scale-110">
              <Ic n='Play' size={30} className="ms-1 fill-current" />
            </span>
          </span>
          {p.caption && (
            <span className="absolute bottom-4 start-4 rounded-full bg-ink-950/80 px-3.5 py-1.5 text-[12px] font-semibold text-white backdrop-blur">
              {tr(p.caption, ctx.lang)}
            </span>
          )}
        </button>
      )}
    </Element>
  )

  if (variant === 'split') {
    return (
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            {p.eyebrow && <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-brand-700"><Editable k="eyebrow" field="eyebrow" as="span" /></span>}
            <Editable k="heading" field="heading" as="h2" className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink-950 sm:text-4xl" />
            <Editable k="subheading" field="subheading" as="p" className="text-[15px] leading-relaxed text-ink-600" />
            {p.statsOn && stats.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-6 border-t border-[var(--border)] pt-6">
                {stats.map((s, i) => (
                  <div key={i}>
                    <Editable k={`stat.${i}.value`} field={`stats.${i}.value`} valueKind="plain" as="p" className="font-display text-2xl font-extrabold text-ink-950" affordance={false} />
                    <Editable k={`stat.${i}.label`} field={`stats.${i}.label`} as="p" className="text-[12.5px] font-medium text-ink-500" affordance={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {player}
        </div>
      </Section>
    )
  }

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align="center" className="mb-10" />}
      <div className="mx-auto max-w-4xl">{player}</div>
    </Section>
  )
}

export function MenuRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const dishes = ctx.records(p.collection ?? 'menu').slice(0, p.limit ?? 9)
  const variant = p.variant ?? 'elegant'
  const cols = GRID[p.columns ?? 2] ?? GRID[2]

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-12" />}
      <div className={cn('grid gap-6', cols)}>
        {dishes.map((dish, i) => {
          const tags: any[] = dish.tags ?? []
          if (variant === 'cards') {
            return (
              <EditableItem key={i} k="items" index={i} className="group h-full">
                <Card className="overflow-hidden">
                  <ImageBox src={dish.image} ratio="4/3" rounded="rounded-none" />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Editable k={`item.${i}.name`} as="h3" className="font-display text-[16.5px] font-bold text-ink-950" affordance={false} fallback={tr(dish.name, lang)} />
                      {dish.spicy && p.showSpicy && <Ic n='Flame' size={16} className="mt-1 shrink-0 text-rose-500" />}
                    </div>
                    <Editable k={`item.${i}.description`} as="p" className="text-[13.5px] leading-relaxed text-ink-500" affordance={false} fallback={tr(dish.description, lang)} />
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <PriceTag value={dish.price} lang={lang} size="md" />
                      <span className="text-[11px] font-bold uppercase tracking-wide text-brand-600">{tr(dish.section, lang)}</span>
                    </div>
                  </div>
                </Card>
              </EditableItem>
            )
          }
          return (
            <EditableItem key={i} k="items" index={i} className="flex flex-col gap-2 py-4">
              <div className="flex items-baseline gap-3">
                <Editable k={`item.${i}.name`} as="h3" className="font-display text-[16px] font-bold text-ink-950" affordance={false} fallback={tr(dish.name, lang)} />
                {dish.spicy && p.showSpicy && <Ic n='Flame' size={14} className="shrink-0 text-rose-500" />}
                <span className="mx-1 h-px flex-1 self-center border-b border-dotted border-ink-300" />
                <PriceTag value={dish.price} lang={lang} size="sm" />
              </div>
              {variant === 'elegant' && (
                <Editable k={`item.${i}.description`} as="p" className="max-w-lg text-[13.5px] leading-relaxed text-ink-500" affordance={false} fallback={tr(dish.description, lang)} />
              )}
              {p.showTags && tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t, ti) => (
                    <span key={ti} className="rounded-full bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-700">
                      {tr(t, lang)}
                    </span>
                  ))}
                </div>
              )}
            </EditableItem>
          )
        })}
      </div>
      {p.bottomCta?.label && tr(p.bottomCta.label, lang) && (
        <div className="mt-10 flex justify-center">
          <KitButton k="bottomCta.button" field="bottomCta.label" href={p.bottomCta.href} icon={p.bottomCta.icon} variant={p.bottomCta.variant ?? 'primary'} size="lg" />
        </div>
      )}
    </Section>
  )
}

export function EventsRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const events = ctx.records(p.collection ?? 'events').slice(0, p.limit ?? 4)
  const variant = p.variant ?? 'list'

  return (
    <Section>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} className="mb-12" />}

      {variant === 'cards' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev, i) => (
            <EditableItem key={i} k="items" index={i} className="h-full">
              <Card className="overflow-hidden">
                <div className="relative">
                  <ImageBox src={ev.image} ratio="16/10" rounded="rounded-none" />
                  <span className="absolute start-3 top-3 flex flex-col items-center rounded-2xl bg-white/95 px-3 py-1.5 shadow-soft backdrop-blur">
                    <span className="font-display text-lg font-extrabold leading-none text-ink-950">{ev.date ? new Date(ev.date).getDate() : '—'}</span>
                    <span className="text-[10.5px] font-bold uppercase tracking-wide text-brand-600">{ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short' }) : ''}</span>
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5">
                  <Editable k={`item.${i}.title`} as="h3" className="font-display text-[16.5px] font-bold text-ink-950" affordance={false} fallback={tr(ev.title, lang)} />
                  <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500">
                    <Ic n='MapPin' size={13} className="text-brand-600" />
                    {tr(ev.venue, lang)} · {ev.time}
                  </p>
                  <Editable k={`item.${i}.description`} as="p" className="line-clamp-2 text-[13.5px] text-ink-500" affordance={false} fallback={tr(ev.description, lang)} />
                  <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
                    {p.showPrice && (ev.price?.amount ? <PriceTag value={ev.price} lang={lang} size="sm" /> : <span className="text-[13px] font-bold text-emerald-600">{t(ctx.lang, 'free')}</span>)}
                    <KitButton k={`item.${i}.cta`} field="ctaLabel" href={p.ctaHref} variant="secondary" size="sm" />
                  </div>
                </div>
              </Card>
            </EditableItem>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((ev, i) => (
            <EditableItem key={i} k="items" index={i} className="group flex flex-col gap-5 rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <span className="font-display text-xl font-extrabold leading-none">{ev.date ? new Date(ev.date).getDate() : '—'}</span>
                <span className="text-[10.5px] font-bold uppercase tracking-wide">{ev.date ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short' }) : ''}</span>
              </div>
              <div className="min-w-0 flex-1">
                <Editable k={`item.${i}.title`} as="h3" className="font-display text-[16.5px] font-bold text-ink-950" affordance={false} fallback={tr(ev.title, lang)} />
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-medium text-ink-500">
                  <span className="flex items-center gap-1.5"><Ic n='Clock' size={13} />{ev.time}</span>
                  <span className="flex items-center gap-1.5"><Ic n='MapPin' size={13} />{tr(ev.venue, lang)}</span>
                  {p.showPrice && <span className="flex items-center gap-1.5"><Ic n='Ticket' size={13} />{ev.price?.amount ? `${ev.price.currency} ${ev.price.amount}` : 'Free'}</span>}
                </div>
              </div>
              <KitButton k={`item.${i}.cta`} field="ctaLabel" href={p.ctaHref} variant="outline" size="md" className="shrink-0" />
            </EditableItem>
          ))}
        </div>
      )}
    </Section>
  )
}

export function CtaBannerRenderer() {
  const ctx = useBlockCtx()
  const p = ctx.block.props
  const variant = p.variant ?? 'soft'
  const dark = variant === 'dark' || variant === 'gradient'
  const Icon = resolveIcon(p.icon)

  return (
    <Section>
      <Element
        k="banner"
        className={cn(
          'flex flex-col items-start gap-6 rounded-[26px] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9',
          variant === 'soft' && 'border border-brand-100 bg-brand-50',
          variant === 'outline' && 'border border-ink-200 bg-white',
          variant === 'dark' && 'bg-ink-950 text-white',
          variant === 'gradient' && 'bg-gradient-to-r from-brand-600 to-brand-700 text-white',
        )}
      >
        <div className="flex items-center gap-4">
          <span className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', dark ? 'bg-white/15 text-white' : 'bg-white text-brand-600 shadow-soft')}>
            <Icon size={22} />
          </span>
          <div>
            <Editable k="heading" field="heading" as="h3" className={cn('font-display text-xl font-extrabold tracking-tight', dark ? 'text-white' : 'text-ink-950')} />
            <Editable k="subheading" field="subheading" as="p" className={cn('mt-1 text-[14px]', dark ? 'text-white/70' : 'text-ink-600')} />
          </div>
        </div>
        <KitButton k="primaryCta.button" field="primaryCta.label" href={p.primaryCta?.href} icon={p.primaryCta?.icon} iconRight="ArrowRight" variant={dark ? 'glass' : 'primary'} size="lg" className="shrink-0" />
      </Element>
    </Section>
  )
}

export function SocialFollowRenderer() {
  const ctx = useBlockCtx()
  const { lang } = ctx
  const p = ctx.block.props
  const items: any[] = p.items ?? []
  const variant = p.variant ?? 'cards'
  const dark = variant === 'dark'

  return (
    <Section className={dark ? 'text-white' : ''} innerStyle={dark ? { background: '#0e1017' } : undefined}>
      {(p.heading || p.eyebrow) && <SectionHeading k="heading" field="heading" eyebrowField="eyebrow" subtitleField="subheading" align={headingAlign(p.align)} light={dark} className="mb-10" />}
      <div className={cn('grid gap-4', variant === 'pills' ? 'grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-4')}>
        {items.map((item, i) => {
          const Icon = resolveIcon(item.icon)
          if (variant === 'pills') {
            return (
              <EditableItem key={i} k="items" index={i} className="flex items-center gap-3 rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
                <Icon size={20} className="shrink-0 text-brand-600" />
                <div className="min-w-0">
                  <Editable k={`item.${i}.handle`} field={`items.${i}.handle`} valueKind="plain" as="p" className="truncate text-[13px] font-bold text-ink-950" affordance={false} />
                  <p className="text-[11.5px] text-ink-500">{item.metric} {tr(item.metricLabel, lang)}</p>
                </div>
              </EditableItem>
            )
          }
          return (
            <EditableItem
              key={i}
              k="items"
              index={i}
              className={cn(
                'flex flex-col gap-4 rounded-2xl p-6 transition hover:-translate-y-1',
                dark ? 'border border-white/10 bg-white/5 backdrop-blur' : 'border border-ink-200/70 bg-white shadow-soft hover:shadow-lift',
              )}
            >
              <span className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl', dark ? 'bg-white/10 text-white' : 'bg-brand-50 text-brand-600')}>
                <Icon size={22} />
              </span>
              <div>
                <Editable k={`item.${i}.handle`} field={`items.${i}.handle`} valueKind="plain" as="p" className={cn('font-display text-[15.5px] font-bold', dark ? 'text-white' : 'text-ink-950')} affordance={false} />
                <p className={cn('mt-0.5 text-[13px]', dark ? 'text-white/60' : 'text-ink-500')}>
                  <span className="font-bold tabular-nums">{item.metric}</span> {tr(item.metricLabel, lang)}
                </p>
              </div>
              <span className={cn('mt-auto inline-flex items-center gap-1.5 text-[13px] font-bold', dark ? 'text-white/80' : 'text-brand-600')}>
                Follow
                <Ic n='ArrowUpRight' size={14} />
              </span>
            </EditableItem>
          )
        })}
      </div>
    </Section>
  )
}
