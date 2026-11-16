import type { ThemeTokens } from './types'

/* ============================================================
   Brand colour ramps. Each preset is a full 11-stop ramp so the
   editor can produce coherent hovers, tints and dark surfaces.
   ============================================================ */
export interface BrandRamp {
  name: string
  label: string
  hint: string
  ramp: Record<string, string>
}

const ramp = (
  c50: string, c100: string, c200: string, c300: string, c400: string,
  c500: string, c600: string, c700: string, c800: string, c900: string, c950: string,
): Record<string, string> => ({
  '50': c50, '100': c100, '200': c200, '300': c300, '400': c400,
  '500': c500, '600': c600, '700': c700, '800': c800, '900': c900, '950': c950,
})

export const BRAND_RAMPS: BrandRamp[] = [
  {
    name: 'indigo', label: 'Indigo', hint: 'SaaS · corporate · fintech',
    ramp: ramp('#eef2ff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#1e1b4b'),
  },
  {
    name: 'ocean', label: 'Ocean', hint: 'healthcare · travel · services',
    ramp: ramp('#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344'),
  },
  {
    name: 'emerald', label: 'Emerald', hint: 'real estate · eco · wellness',
    ramp: ramp('#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#022c22'),
  },
  {
    name: 'amber', label: 'Amber', hint: 'food · retail · marketplace',
    ramp: ramp('#fffbeb', '#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', '#451a03'),
  },
  {
    name: 'rose', label: 'Rose', hint: 'beauty · fashion · lifestyle',
    ramp: ramp('#fff1f2', '#ffe4e6', '#fecdd3', '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337', '#4c0519'),
  },
  {
    name: 'violet', label: 'Violet', hint: 'creative · AI · education',
    ramp: ramp('#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#2e1065'),
  },
  {
    name: 'slate', label: 'Slate', hint: 'legal · consulting · portfolio',
    ramp: ramp('#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#020617'),
  },
  {
    name: 'crimson', label: 'Crimson', hint: 'automotive · sports · news',
    ramp: ramp('#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#450a0a'),
  },
]

export const FONT_STACKS: { name: string; label: string; stack: string; script?: 'latin' | 'arabic' | 'both' }[] = [
  { name: 'inter', label: 'Inter — neutral UI', stack: "'Inter', system-ui, sans-serif", script: 'latin' },
  { name: 'jakarta', label: 'Plus Jakarta — editorial', stack: "'Plus Jakarta Sans', system-ui, sans-serif", script: 'latin' },
  { name: 'georgia', label: 'Georgia — classic serif', stack: "Georgia, 'Times New Roman', serif", script: 'latin' },
  { name: 'mono', label: 'Mono — technical', stack: "ui-monospace, 'SF Mono', Menlo, monospace", script: 'latin' },
  { name: 'plex-arabic', label: 'IBM Plex Arabic — RTL native', stack: "'IBM Plex Sans Arabic', system-ui, sans-serif", script: 'arabic' },
  { name: 'cairo', label: 'Cairo — modern Arabic', stack: "'Cairo', system-ui, sans-serif", script: 'arabic' },
]

export const RADIUS_SCALE = [
  { value: 0, label: 'Sharp' },
  { value: 6, label: 'Subtle' },
  { value: 12, label: 'Soft' },
  { value: 20, label: 'Rounded' },
  { value: 32, label: 'Pill' },
]

export const CONTAINER_WIDTHS = [
  { value: 1080, label: 'Compact · 1080' },
  { value: 1200, label: 'Standard · 1200' },
  { value: 1320, label: 'Wide · 1320' },
  { value: 1480, label: 'Ultra · 1480' },
]

export const DEFAULT_BRAND = BRAND_RAMPS[0].ramp

export function defaultTheme(preset = 'indigo'): ThemeTokens {
  const found = BRAND_RAMPS.find((r) => r.name === preset) ?? BRAND_RAMPS[0]
  return {
    preset: found.name,
    brand: { ...found.ramp },
    fontSans: "'Inter', system-ui, sans-serif",
    fontDisplay: "'Plus Jakarta Sans', system-ui, sans-serif",
    radius: 16,
    mode: 'light',
    pageBg: '#ffffff',
    containerWidth: 1200,
  }
}

/** Convert "#2540e6" to "37 64 230" so Tailwind can apply alpha modifiers. */
function hexToChannels(hex: string): string {
  const clean = (hex || '').replace('#', '').trim()
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6)
  const int = parseInt(full || '000000', 16)
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

/** Push theme tokens onto a DOM node as CSS custom properties. */
export function applyTheme(el: HTMLElement | null, themeInput?: Partial<ThemeTokens> | null) {
  if (!el || !themeInput) return
  const theme: ThemeTokens = { ...defaultTheme(), ...themeInput, brand: themeInput.brand ?? defaultTheme().brand }
  Object.entries(theme.brand).forEach(([stop, value]) => {
    el.style.setProperty(`--brand-${stop}`, value)
    el.style.setProperty(`--brand-${stop}-rgb`, hexToChannels(value))
  })
  el.style.setProperty('--font-sans', theme.fontSans)
  el.style.setProperty('--font-display', theme.fontDisplay)
  el.style.setProperty('--radius', `${theme.radius}px`)
  el.style.setProperty('--shell', `${theme.containerWidth}px`)
  el.style.setProperty('--surface', theme.mode === 'dark' ? '#0b1020' : theme.pageBg)
  el.style.setProperty('--surface-2', theme.mode === 'dark' ? '#111730' : '#f7f8fb')
  el.style.setProperty('--surface-3', theme.mode === 'dark' ? '#182042' : '#eef1f6')
  el.style.setProperty('--fg', theme.mode === 'dark' ? '#f4f6fb' : '#0e1017')
  el.style.setProperty('--fg-muted', theme.mode === 'dark' ? '#a7b0c6' : '#5b6479')
  el.style.setProperty('--border', theme.mode === 'dark' ? 'rgba(255,255,255,.10)' : 'rgba(15,23,42,.08)')
  el.style.setProperty('--border-strong', theme.mode === 'dark' ? 'rgba(255,255,255,.18)' : 'rgba(15,23,42,.14)')
}

/** Derive a 50/500/600/700 tint trio from an arbitrary hex for ad-hoc overrides. */
export function rampFromHex(hex: string): Record<string, string> {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.replace('#', '').padEnd(6, '0').slice(i - 1, i + 1) || '00', 16))
  const mix = (t: number) => {
    const m = (c: number) => Math.round(c + (255 - c) * t)
    return `rgb(${m(r)}, ${m(g)}, ${m(b)})`
  }
  return { '50': mix(0.94), '100': mix(0.86), '500': hex, '600': hex, '700': hex }
}
