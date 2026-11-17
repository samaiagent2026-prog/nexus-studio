import React from 'react'
import { resolveIcon, Ic } from '../../../lib/icons'
import { t } from '../../../lib/i18n'
import { cn, tr } from '../../../lib/utils'
import { Container, Editable, Element, KitButton } from '../kit'
import { useBlockCtx } from '../context'

/* ============================================================
   Header / footer / announcement renderers.
   These sit outside the page's section flow and stay fully
   editable in the canvas.
   ============================================================ */

const HEADER_STYLES: Record<string, string> = {
  light: 'bg-white/90 text-ink-900 border-b border-ink-200/70',
  glass: 'glass text-ink-900',
  dark: 'bg-ink-950/95 text-white border-b border-white/10',
  brand: 'bg-brand-600 text-white',
}

/**
 * Logo element that accepts an image dropped straight onto it in edit mode.
 * Dropping sets the header logo; a click still selects the element as usual.
 */
function LogoDrop({
  value,
  onDrop,
  children,
  label,
}: {
  value?: string
  onDrop: (url: string) => void
  children: React.ReactNode
  label: string
}) {
  const ctx = useBlockCtx()
  const [over, setOver] = React.useState(false)
  const editing = ctx.mode === 'edit'
  const readFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onDrop(String(reader.result))
    reader.readAsDataURL(file)
  }
  return (
    <div
      onDragOver={(e) => {
        if (!editing) return
        e.preventDefault()
        e.stopPropagation()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!editing) return
        e.preventDefault()
        e.stopPropagation()
        setOver(false)
        const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
        if (url && /^(https?:|data:image)/.test(url.trim())) onDrop(url.trim())
        else readFile(e.dataTransfer.files?.[0])
      }}
      className={cn('relative rounded-xl transition', editing && over && 'ring-2 ring-brand-500 ring-offset-2')}
      data-logo-drop={editing ? '' : undefined}
      title={editing ? label : undefined}
    >
      {children}
      {editing && over && (
        <span className="pointer-events-none absolute -bottom-7 start-0 z-30 whitespace-nowrap rounded-lg bg-brand-600 px-2 py-1 text-[10.5px] font-bold text-white shadow-lift">
          {label}
        </span>
      )}
      {editing && !value && !over && (
        <span className="pointer-events-none absolute -bottom-6 start-0 z-30 whitespace-nowrap rounded-lg bg-ink-950/85 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
          {label}
        </span>
      )}
    </div>
  )
}

export function HeaderRenderer() {
  const ctx = useBlockCtx()
  const { block, lang, mode } = ctx
  const p = block.props
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    if (!p.sticky) return
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [p.sticky])

  const dark = p.style === 'dark' || p.style === 'brand'
  const links: any[] = p.links ?? []
  const LogoIcon = resolveIcon('Gem')

  return (
    <header
      className={cn(
        'relative z-30 w-full transition-all duration-300',
        HEADER_STYLES[p.style] ?? HEADER_STYLES.light,
        p.sticky && 'sticky top-0',
        p.sticky && scrolled && 'shadow-lift backdrop-blur-xl',
      )}
      data-block-id={block.id}
      data-block-type="header"
    >
      {p.topbarOn && (
        <Element
          k="topbar"
          className={cn('flex items-center justify-center gap-3 px-4 py-2 text-[12.5px] font-medium', dark ? 'bg-white/10 text-white' : 'bg-brand-600 text-white')}
        >
          <Element k="topbar.icon" as="span" className="hidden sm:inline-flex" affordance={false}>
            <Ic n='Megaphone' size={14} />
          </Element>
          <Editable k="topbar.text" field="topbarText" as="span" className="truncate" />
          {(p.phone || mode === 'edit') && (
            <span className="hidden items-center gap-1.5 md:inline-flex">
              <Ic n='Phone' size={13} />
              <Editable k="topbar.phone" field="phone" valueKind="plain" as="span" className="tabular-nums" />
            </span>
          )}
        </Element>
      )}

      <Container>
        <div className="flex h-[68px] items-center justify-between gap-4">
          <LogoDrop value={p.logoImage} onDrop={(url) => ctx.updateProp('logoImage', url)} label={t(lang, 'dragLogoHint')}>
            <Element k="logo" as="a" className="group flex shrink-0 items-center gap-2.5" href={ctx.href('/')}>
              {p.logoImage ? (
                <img src={p.logoImage} alt="" className="h-9 w-auto max-w-[160px] object-contain" />
              ) : (
                <Element
                  k="logo.mark"
                  as="span"
                  affordance={false}
                  className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-105', dark ? 'bg-white/15 text-white' : 'bg-brand-600 text-white')}
                >
                  <LogoIcon size={18} />
                </Element>
              )}
              <Editable k="logo.text" field="logoText" as="span" className="font-display text-[17px] font-extrabold tracking-tight" />
            </Element>
          </LogoDrop>

          <Element k="nav" as="nav" className="hidden items-center gap-0.5 lg:flex" affordance={false}>
            {links.map((link, i) => (
              <a
                key={i}
                href={ctx.href(link.href ?? '#')}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors',
                  dark ? 'text-white/85 hover:bg-white/10 hover:text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                  ctx.selection?.elementKey === `nav.${i}` && 'outline outline-2 outline-brand-500',
                )}
                data-el={mode === 'edit' ? `nav.${i}` : undefined}
                onClick={(e) => {
                  if (mode === 'edit') {
                    e.preventDefault()
                    e.stopPropagation()
                    ctx.select(block.id, `nav.${i}`)
                  }
                }}
              >
                <Editable k={`nav.${i}.label`} field={`links.${i}.label`} as="span" affordance={false} />
              </a>
            ))}
          </Element>

          <div className="flex items-center gap-2">
            {p.showSearch && (
              <Element
                k="search"
                as="button"
                type="button"
                className={cn(
                  'hidden h-10 items-center gap-2 rounded-xl border px-3 text-[13px] font-medium transition md:inline-flex',
                  dark ? 'border-white/20 text-white/80 hover:bg-white/10' : 'border-ink-200 text-ink-500 hover:border-ink-300 hover:bg-ink-50',
                )}
              >
                <Ic n='Search' size={15} />
                <Editable k="search.text" field="searchPlaceholder" as="span" className="max-w-[190px] truncate" />
              </Element>
            )}

            {p.showLang && (
              <Element k="lang" as="div" className={cn('hidden items-center rounded-xl border p-0.5 sm:inline-flex', dark ? 'border-white/20' : 'border-ink-200')}>
                {(['en', 'ar'] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    data-nexus-lang={mode === 'edit' ? undefined : code}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (mode === 'edit') return
                      window.dispatchEvent(new CustomEvent('nexus:set-lang', { detail: code }))
                    }}
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 text-[12px] font-bold uppercase transition',
                      lang === code ? 'bg-brand-600 text-white' : dark ? 'text-white/70 hover:text-white' : 'text-ink-500 hover:text-ink-800',
                      mode !== 'edit' && (lang === code ? 'nexus-lang-on' : 'nexus-lang-off'),
                    )}
                  >
                    {code}
                  </button>
                ))}
              </Element>
            )}

            {p.showCta && (
              <KitButton k="cta.button" field="ctaLabel" href={p.ctaHref} icon="ArrowRight" size="md" variant={dark ? 'glass' : 'primary'} className="hidden sm:inline-flex" />
            )}

            <button
              type="button"
              data-nexus-menu-toggle={mode === 'edit' ? undefined : ''}
              aria-expanded={open}
              onClick={(e) => {
                e.stopPropagation()
                setOpen((v) => !v)
              }}
              aria-label={t(ctx.lang, 'menuLabel')}
              className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl border transition lg:hidden', dark ? 'border-white/20 text-white' : 'border-ink-200 text-ink-700')}
            >
              <Ic n={open ? 'X' : 'Menu'} size={18} />
            </button>
          </div>
        </div>
      </Container>

      {(open || mode !== 'edit') && (
        <div
          data-nexus-menu={mode === 'edit' ? undefined : ''}
          className={cn(
            'border-t lg:hidden',
            dark ? 'border-white/10 bg-ink-950' : 'border-ink-200 bg-white',
            mode !== 'edit' && !open && 'hidden',
          )}
        >
          <Container>
            <nav className="flex flex-col py-2">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={ctx.href(link.href ?? '#')}
                  onClick={(e) => {
                    if (mode === 'edit') {
                      e.preventDefault()
                      ctx.select(block.id, `nav.${i}`)
                    } else setOpen(false)
                  }}
                  className={cn('rounded-lg px-3 py-2.5 text-sm font-semibold', dark ? 'text-white/85' : 'text-ink-700')}
                >
                  {tr(link.label, lang)}
                </a>
              ))}
              {p.showCta && (
                <div className="pb-3 pt-2">
                  <KitButton k="cta.button" field="ctaLabel" href={p.ctaHref} variant="primary" size="md" className="w-full" />
                </div>
              )}
            </nav>
          </Container>
        </div>
      )}
    </header>
  )
}

export function FooterRenderer() {
  const ctx = useBlockCtx()
  const { block, lang } = ctx
  const p = block.props
  const [email, setEmail] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const socials: any[] = p.socials ?? []
  const columns: any[] = p.columns ?? []
  const legal: any[] = p.legal ?? []

  return (
    <footer className="relative w-full bg-ink-950 text-white" data-block-id={block.id} data-block-type="footer">
      <div className="pointer-events-none absolute inset-0 opacity-60 grid-lines" />
      <Container className="relative">
        <div className="grid gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-20">
          <div className="lg:col-span-4">
            <LogoDrop value={p.logoImage} onDrop={(url) => ctx.updateProp('logoImage', url)} label={t(lang, 'dragLogoHint')}>
              <Element k="brand" as="div" className="flex items-center gap-2.5">
                {p.logoImage ? (
                  <img src={p.logoImage} alt="" className="h-9 w-auto max-w-[170px] object-contain" />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
                    <Ic n='Gem' size={18} />
                  </span>
                )}
                <Editable k="brand.text" field="brand" as="span" className="font-display text-lg font-extrabold tracking-tight" />
              </Element>
            </LogoDrop>
            <Editable k="about" field="about" as="p" className="mt-4 max-w-sm text-sm leading-relaxed text-white/60" />

            {socials.length > 0 && (
              <Element k="socials" as="div" className="mt-6 flex items-center gap-2">
                {socials.map((s, i) => {
                  const Icon = resolveIcon(s.icon)
                  return (
                    <a
                      key={i}
                      href={ctx.href(s.href ?? '#')}
                      data-el={ctx.mode === 'edit' ? `socials.${i}` : undefined}
                      onClick={(e) => {
                        if (ctx.mode === 'edit') {
                          e.preventDefault()
                          e.stopPropagation()
                          ctx.select(block.id, `socials.${i}`)
                        }
                      }}
                      className={cn(
                        'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:-translate-y-0.5 hover:bg-brand-500 hover:text-white',
                        ctx.selection?.elementKey === `socials.${i}` && 'outline outline-2 outline-brand-400',
                      )}
                      aria-label={s.icon}
                    >
                      <Icon size={17} />
                    </a>
                  )
                })}
              </Element>
            )}

            {p.showBadges && (
              <div className="mt-6 flex flex-wrap gap-2">
                {['Shield', 'BadgeCheck', 'Leaf'].map((ic, i) => {
                  const Icon = resolveIcon(ic)
                  return (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">
                      <Icon size={12} />
                      {[t(ctx.lang, 'sslSecured'), t(ctx.lang, 'gdprReady'), t(ctx.lang, 'carbonNeutral')][i]}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-5">
            {columns.map((col, ci) => (
              <Element
                key={ci}
                k={`column.${ci}`}
                as="div"
                data-el={ctx.mode === 'edit' ? `columns.${ci}` : undefined}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  if (ctx.mode === 'edit') {
                    e.stopPropagation()
                    ctx.select(block.id, `columns.${ci}`)
                  }
                }}
              >
                <Editable k={`column.${ci}.title`} field={`columns.${ci}.title`} as="h4" className="mb-4 text-[13px] font-bold uppercase tracking-[0.12em] text-white/50" affordance={false} />
                <ul className="space-y-2.5">
                  {(col.links ?? []).map((link: any, li: number) => (
                    <li key={li}>
                      <a
                        href={ctx.href(link.href ?? '#')}
                        data-el={ctx.mode === 'edit' ? `columns.${ci}.links.${li}` : undefined}
                        onClick={(e) => {
                          if (ctx.mode === 'edit') {
                            e.preventDefault()
                            e.stopPropagation()
                            ctx.select(block.id, `columns.${ci}.links.${li}`)
                          }
                        }}
                        className={cn('text-sm text-white/70 transition hover:text-white', ctx.selection?.elementKey === `columns.${ci}.links.${li}` && 'outline outline-2 outline-brand-400')}
                      >
                        <Editable k={`link.${ci}.${li}`} field={`columns.${ci}.links.${li}.label`} as="span" affordance={false} />
                      </a>
                    </li>
                  ))}
                </ul>
              </Element>
            ))}
          </div>

          {p.newsletterOn && (
            <Element k="newsletter" as="div" className="lg:col-span-3">
              <Editable k="newsletter.title" field="newsletterTitle" as="h4" className="font-display text-base font-bold" />
              <Editable k="newsletter.text" field="newsletterText" as="p" className="mt-2 text-sm text-white/60" />
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (ctx.mode === 'edit') return
                  setSent(true)
                  setEmail('')
                }}
              >
                <div className="flex gap-2">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                    placeholder={t(ctx.lang, 'emailPlaceholder')}
                    onClick={(e) => ctx.mode === 'edit' && e.stopPropagation()}
                    className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/20"
                  />
                  <button type="submit" className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-400" aria-label={t(ctx.lang, 'subscribe')}>
                    <Ic n={sent ? 'Check' : 'Send'} size={17} />
                  </button>
                </div>
                {sent && <p className="mt-2 text-xs font-medium text-emerald-400">{t(lang, 'saved')}</p>}
              </form>
            </Element>
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row">
          <Editable k="copyright" field="copyright" as="p" />
          <div className="flex items-center gap-5">
            {legal.map((item, i) => (
              <a
                key={i}
                href={ctx.href(item.href ?? '#')}
                onClick={(e) => {
                  if (ctx.mode === 'edit') {
                    e.preventDefault()
                    e.stopPropagation()
                    ctx.select(block.id, `legal.${i}`)
                  }
                }}
                className={cn('transition hover:text-white', ctx.selection?.elementKey === `legal.${i}` && 'outline outline-2 outline-brand-400')}
              >
                <Editable k={`legal.${i}.label`} field={`legal.${i}.label`} as="span" affordance={false} />
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  )
}

const ANNOUNCE_STYLES: Record<string, string> = {
  gradient: 'bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 text-white',
  dark: 'bg-ink-950 text-white',
  soft: 'bg-brand-50 text-brand-800 border-y border-brand-100',
  outline: 'bg-white text-ink-800 border-y border-ink-200',
}

export function AnnouncementRenderer() {
  const ctx = useBlockCtx()
  const { block, lang, mode } = ctx
  const p = block.props
  const [closed, setClosed] = React.useState(false)
  if (closed) return null
  const Icon = resolveIcon(p.icon)

  const content = (
    <div className="flex items-center gap-2.5">
      <Icon size={15} />
      <Editable k="text" field="text" as="span" className="font-semibold" />
      <span className="mx-1 opacity-40">·</span>
      <a
        href={ctx.href(p.href ?? '#')}
        onClick={(e) => {
          if (mode === 'edit') {
            e.preventDefault()
            e.stopPropagation()
            ctx.select(block.id, 'link')
          }
        }}
        className={cn('inline-flex items-center gap-1 font-bold underline underline-offset-4 transition hover:gap-2', ctx.selection?.elementKey === 'link' && 'outline outline-2 outline-current')}
      >
        <Editable k="link.label" field="linkLabel" as="span" affordance={false} />
        <Ic n='ArrowRight' size={13} className={cn(ctx.dir === 'rtl' && 'rotate-180')} />
      </a>
    </div>
  )

  return (
    <div className={cn('relative w-full', ANNOUNCE_STYLES[p.variant] ?? ANNOUNCE_STYLES.gradient)} data-block-id={block.id} data-block-type="announcement">
      <Container className="py-2.5">
        <div className="flex items-center justify-center gap-4 text-[13px]">
          {p.marquee ? (
            <div className="flex w-full overflow-hidden">
              <div className="flex shrink-0 animate-marquee items-center gap-12">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="flex items-center gap-2.5 whitespace-nowrap">
                    {i === 0 ? content : <span className="font-semibold">{tr(p.text, lang)} · {tr(p.linkLabel, lang)}</span>}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            content
          )}
          {p.dismissible && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setClosed(true)
              }}
              className="absolute end-4 opacity-70 transition hover:opacity-100"
              aria-label={t(ctx.lang, 'dismiss')}
            >
              <Ic n='X' size={15} />
            </button>
          )}
        </div>
      </Container>
    </div>
  )
}

export const LAYOUT_TYPES = new Set(['header', 'footer', 'announcement'])

export const layoutRenderers = {
  header: HeaderRenderer,
  footer: FooterRenderer,
  announcement: AnnouncementRenderer,
}
