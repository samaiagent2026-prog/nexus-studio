import React from 'react'
import { resolveIcon } from '../../lib/icons'
import { BRAND_RAMPS, CONTAINER_WIDTHS, FONT_STACKS, RADIUS_SCALE } from '../../lib/theme'
import type { Lang, Site, ThemeTokens } from '../../lib/types'
import { cn, readableOn } from '../../lib/utils'
import { Badge, ColorInput, Field, Select, Slider, Toggle } from '../ui'
import { ImagePicker } from './ImagePicker'
import { t } from '../../lib/i18n'

/* ============================================================
   Design panel — global theme tokens, brand ramp, typography.
   ============================================================ */

export function DesignPanel({
  site,
  lang,
  onTheme,
  onPreset,
  onLogo,
  onAddMedia,
}: {
  site: Site
  lang: Lang
  onTheme: (patch: Partial<ThemeTokens>) => void
  onPreset: (preset: string) => void
  onLogo: (url: string) => void
  onAddMedia: (assets: Site['media']) => void
}) {
  const theme = site.theme
  const stops = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

  return (
    <div className="flex flex-col gap-5 p-3.5">
      <section className="flex flex-col gap-3">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'colourPreset')}</h4>
        <div className="grid grid-cols-4 gap-2">
          {BRAND_RAMPS.map((preset) => {
            const active = theme.preset === preset.name
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onPreset(preset.name)}
                title={`${preset.label} — ${preset.hint}`}
                className={cn('flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition', active ? 'border-brand-500 bg-brand-50/60 shadow-soft' : 'border-ink-200 bg-white hover:-translate-y-0.5 hover:border-brand-300')}
              >
                <span className="h-8 w-full rounded-lg" style={{ background: `linear-gradient(135deg, ${preset.ramp['500']}, ${preset.ramp['700']})` }} />
                <span className="text-[10.5px] font-bold text-ink-700">{preset.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'brandRamp')}</h4>
          <Badge tone="brand">{theme.preset}</Badge>
        </div>
        <div className="flex h-9 overflow-hidden rounded-xl border border-ink-200">
          {stops.map((stop) => (
            <span key={stop} className="flex-1" style={{ background: theme.brand[stop] }} title={`${stop} · ${theme.brand[stop]}`} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['500', '600'] as const).map((stop) => (
            <Field key={stop} label={`Brand ${stop}`}>
              <ColorInput value={theme.brand[stop]} onChange={(v) => v && onTheme({ brand: { ...theme.brand, [stop]: v }, preset: 'custom' })} lang={lang} />
            </Field>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'typography')}</h4>
        <Field label={t(lang, 'bodyFont')}>
          <Select value={theme.fontSans} onChange={(v) => onTheme({ fontSans: v })} options={FONT_STACKS.map((f) => ({ value: f.stack, label: f.label }))} />
        </Field>
        <Field label={t(lang, 'displayFont')}>
          <Select value={theme.fontDisplay} onChange={(v) => onTheme({ fontDisplay: v })} options={FONT_STACKS.map((f) => ({ value: f.stack, label: f.label }))} />
        </Field>
        <div className="rounded-2xl border border-ink-200 bg-white p-3.5">
          <p className="font-display text-lg font-extrabold text-ink-950" style={{ fontFamily: theme.fontDisplay }}>
            The quick brown fox
          </p>
          <p className="mt-1 text-[13px] text-ink-500" style={{ fontFamily: theme.fontSans }}>
            يجري الثعلب البني السريع فوق الكلب الكسول
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'shapeLayout')}</h4>
        <Field label={t(lang, 'cornerRadius')}>
          <div className="flex gap-1.5">
            {RADIUS_SCALE.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onTheme({ radius: r.value })}
                className={cn('flex flex-1 flex-col items-center gap-1.5 rounded-xl border p-2 transition', theme.radius === r.value ? 'border-brand-500 bg-brand-50' : 'border-ink-200 bg-white hover:border-brand-300')}
              >
                <span className="h-6 w-6 border-2 border-brand-500" style={{ borderRadius: `${Math.min(r.value / 2, 12)}px` }} />
                <span className="text-[10px] font-bold text-ink-600">{r.label}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label={t(lang, 'containerWidth')}>
          <Select value={String(theme.containerWidth)} onChange={(v) => onTheme({ containerWidth: Number(v) })} options={CONTAINER_WIDTHS.map((c) => ({ value: String(c.value), label: c.label }))} />
        </Field>
        <Slider label={t(lang, 'radiusFine')} value={theme.radius} onChange={(v) => onTheme({ radius: v })} min={0} max={40} unit="px" />
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'surfaces')}</h4>
        <Toggle checked={theme.mode === 'dark'} onChange={(v) => onTheme({ mode: v ? 'dark' : 'light' })} label={t(lang, 'darkSurfaces')} hint={t(lang, 'darkSurfacesHint')} />
        <Field label={t(lang, 'pageBackground')}>
          <ColorInput value={theme.pageBg} onChange={(v) => v && onTheme({ pageBg: v })} lang={lang} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-ink-200 p-3" style={{ background: theme.pageBg }}>
            <p className="text-[11px] font-bold" style={{ color: readableOn(theme.pageBg) }}>{t(lang, 'lightSurface')}</p>
          </div>
          <div className="rounded-2xl border border-white/10 p-3" style={{ background: '#0e1017' }}>
            <p className="text-[11px] font-bold text-white">{t(lang, 'darkSurface')}</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'brandingAssets')}</h4>
        <Field label={t(lang, 'siteLogo')} hint={t(lang, 'siteLogoHint')}>
          <ImagePicker value={site.logo} onChange={onLogo} media={site.media} onAddMedia={onAddMedia} label={t(lang, 'siteLogo')} />
        </Field>
      </section>
    </div>
  )
}
