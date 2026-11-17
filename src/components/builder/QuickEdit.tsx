import React from 'react'
import { Ic } from '../../lib/icons'
import { t } from '../../lib/i18n'
import { cn, getPath } from '../../lib/utils'
import type { Block, ElementStyle, Lang, MediaAsset } from '../../lib/types'
import type { BlockDefinition } from '../../lib/schema'
import { capabilitiesFor, groupCapabilities, type Capability } from '../../lib/capabilities'
import { ColorInput, Field, NumberInput, Segmented, Select, Slider, TextArea, TextInput, Toggle, Tooltip } from '../ui'
import { IconPickerButton } from './IconPicker'
import { ImagePicker, VideoPicker } from './ImagePicker'
import { schemaCopy } from '../../lib/schemaCopy'

/* ============================================================
   Quick edit: everything about the element you clicked, in one
   focused panel. Colours are picked from swatches, fonts from a
   list — no hex codes or CSS required.
   ============================================================ */

const FONTS: { value: string; label: string }[] = [
  { value: '', label: 'Default' },
  { value: "'Inter', system-ui, sans-serif", label: 'Inter' },
  { value: "'Plus Jakarta Sans', system-ui, sans-serif", label: 'Plus Jakarta' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
  { value: "ui-monospace, 'SF Mono', Menlo, monospace", label: 'Mono' },
  { value: "'IBM Plex Sans Arabic', system-ui, sans-serif", label: 'IBM Plex Arabic' },
  { value: "'Cairo', system-ui, sans-serif", label: 'Cairo' },
]

const WEIGHTS: { value: string; label: string }[] = [
  { value: '', label: 'Default' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi-bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra-bold' },
  { value: '900', label: 'Black' },
]

const SHADOWS: { value: string; label: string }[] = [
  { value: '', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'lift', label: 'Lifted' },
  { value: 'glow', label: 'Glow' },
]

export interface QuickEditProps {
  block: Block
  def?: BlockDefinition
  lang: Lang
  elementKey: string
  elementLabel: string
  media: MediaAsset[]
  onAddMedia: (assets: MediaAsset[]) => void
  onChangeProp: (path: string, value: any) => void
  onChangeElement: (elementKey: string, patch: ElementStyle) => void
  onResetElement: (elementKey: string) => void
  onChangeStyle: (patch: Record<string, any>) => void
  onDuplicate: () => void
  onDelete: () => void
  onHide: () => void
  onEditText: () => void
  /** Section position controls (page order). */
  onMove?: (dir: -1 | 1) => void
  onMoveToEdge?: (edge: 'top' | 'bottom') => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  isCatalogue?: boolean
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 first:border-t-0 first:pt-0">
      <h5 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600">
        <Ic n={icon} size={13} />
        {title}
      </h5>
      {children}
    </section>
  )
}

export function QuickEdit(props: QuickEditProps) {
  const { block, def, lang, elementKey, media, onAddMedia, onChangeProp } = props
  const overrides: ElementStyle = block.elements?.[elementKey] ?? {}
  const set = (patch: ElementStyle) => props.onChangeElement(elementKey, patch)
  const isSection = elementKey === 'section'
  const hidden = !!overrides.hidden || !!block.hidden
  const moved = overrides.offsetX != null || overrides.offsetY != null || overrides.scale != null

  const caps = React.useMemo(() => capabilitiesFor(block, def, elementKey), [block, def, elementKey])
  const groups = React.useMemo(() => groupCapabilities(caps), [caps])
  // Typography/colour controls only apply to elements that render text.
  const hasText = !isSection && groups.texts.length > 0
  const [advanced, setAdvanced] = React.useState(false)

  const renderCap = (c: Capability) => {
    const raw = getPath(block.props, c.path)
    const label = schemaCopy(c.label, lang)
    const setProp = (v: any) => onChangeProp(c.path, v)
    switch (c.type) {
      case 'text':
        return (
          <Field key={c.path} label={label}>
            <TextInput value={raw ?? ''} onChange={setProp} />
          </Field>
        )
      case 'textarea':
        return (
          <Field key={c.path} label={label}>
            <TextArea value={raw ?? ''} onChange={setProp} rows={2} />
          </Field>
        )
      case 'localizedText':
      case 'localizedTextarea': {
        const value = typeof raw === 'object' && raw !== null ? raw : { en: raw ?? '', ar: '' }
        const Area = c.type === 'localizedTextarea' ? TextArea : TextInput
        return (
          <Field key={c.path} label={label}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-6 shrink-0 text-[10px] font-bold uppercase text-ink-400">EN</span>
                <Area value={value.en ?? ''} onChange={(v: string) => setProp({ ...value, en: v })} />
              </div>
              <div className="flex items-center gap-1.5" dir="rtl">
                <span className="w-6 shrink-0 text-[10px] font-bold uppercase text-ink-400" dir="ltr">AR</span>
                <Area value={value.ar ?? ''} onChange={(v: string) => setProp({ ...value, ar: v })} />
              </div>
            </div>
          </Field>
        )
      }
      case 'select':
        return (
          <Field key={c.path} label={label}>
            <Select value={String(raw ?? '')} onChange={setProp} options={(c.options ?? []).map((o) => ({ ...o, label: schemaCopy(o.label, lang) }))} />
          </Field>
        )
      case 'toggle':
        return <Toggle key={c.path} checked={!!raw} onChange={setProp} label={label} />
      case 'slider':
        return <Slider key={c.path} label={label} value={Number(raw ?? c.min ?? 0)} onChange={setProp} min={c.min ?? 0} max={c.max ?? 100} step={c.step ?? 1} unit={c.unit} />
      case 'number':
        return (
          <Field key={c.path} label={label}>
            <NumberInput value={Number(raw ?? 0)} onChange={setProp} min={c.min} max={c.max} step={c.step} suffix={c.unit} />
          </Field>
        )
      case 'color':
        return (
          <Field key={c.path} label={label}>
            <ColorInput value={raw} onChange={setProp} allowClear lang={lang} />
          </Field>
        )
      case 'image':
        return (
          <Field key={c.path} label={label}>
            <ImagePicker value={raw} onChange={setProp} media={media} onAddMedia={onAddMedia} lang={lang} />
          </Field>
        )
      case 'icon':
        return (
          <Field key={c.path} label={label}>
            <IconPickerButton value={raw} onChange={setProp} label={label} lang={lang} />
          </Field>
        )
      case 'link':
        return (
          <Field key={c.path} label={label}>
            <div className="flex flex-col gap-1.5">
              <TextInput value={raw ?? ''} onChange={setProp} placeholder="#" icon="Link" />
              <div className="flex flex-wrap gap-1">
                {['/', '/listings', '/contact', '/blog'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProp(p)}
                    className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-600 transition hover:bg-brand-100 hover:text-brand-700"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </Field>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-gradient-to-b from-brand-50/70 to-white px-3.5 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[12.5px] font-extrabold text-ink-950">
            <Ic n={isSection ? 'SquareDashedBottom' : 'MousePointerClick'} size={13} className="shrink-0 text-brand-600" />
            {props.elementLabel}
          </p>
          <p className="truncate text-[10.5px] text-ink-400">{t(lang, 'quickEditTitle')}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip label={t(lang, hidden ? 'showBlock' : 'hideBlock')}>
            <button
              type="button"
              onClick={props.onHide}
              className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg transition', hidden ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-100')}
            >
              <Ic n={hidden ? 'EyeOff' : 'Eye'} size={15} />
            </button>
          </Tooltip>
          {!isSection && (
            <Tooltip label={t(lang, 'deleteElement')}>
              <button type="button" onClick={props.onDelete} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50">
                <Ic n='Trash2' size={15} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3.5">
        {/* -------- text -------- */}
        {groups.texts.length > 0 && (
          <Section title={t(lang, 'textSection')} icon="Type">
            <button type="button" onClick={props.onEditText} className="btn-outline w-full justify-center border-dashed">
              <Ic n='TextCursorInput' size={14} />
              {t(lang, 'editText')}
            </button>
            {groups.texts.map(renderCap)}
          </Section>
        )}

        {groups.images.length > 0 && <Section title={t(lang, 'imageSection')} icon="Image">{groups.images.map(renderCap)}</Section>}
        {groups.icons.length > 0 && <Section title={t(lang, 'iconAndShape')} icon="Sparkles">{groups.icons.map(renderCap)}</Section>}
        {groups.links.length > 0 && <Section title={t(lang, 'linkSection')} icon="Link">{groups.links.map(renderCap)}</Section>}

        {/* -------- typography (only where text actually lives) -------- */}
        {hasText && (
          <Section title={t(lang, 'fontAndSize')} icon="Baseline">
            <Field label={t(lang, 'fontFamily')}>
              <Select value={overrides.fontFamily ?? ''} onChange={(v) => set({ fontFamily: v || undefined })} options={FONTS} />
            </Field>
            <Slider label={t(lang, 'size')} value={overrides.fontSize ?? 0} onChange={(v) => set({ fontSize: v || undefined })} min={0} max={96} unit="px" />
            <Field label={t(lang, 'weight')}>
              <Select value={String(overrides.fontWeight ?? '')} onChange={(v) => set({ fontWeight: v ? Number(v) : undefined })} options={WEIGHTS} />
            </Field>
            <Field label={t(lang, 'alignment')}>
              <Segmented
                value={(overrides.textAlign ?? 'left') as any}
                onChange={(v) => set({ textAlign: v as any })}
                options={[
                  { value: 'left', icon: 'AlignLeft', title: t(lang, 'left') },
                  { value: 'center', icon: 'AlignCenter', title: t(lang, 'center') },
                  { value: 'right', icon: 'AlignRight', title: t(lang, 'right') },
                ]}
              />
            </Field>
            <div className="flex items-center gap-1.5">
              <ToggleBtn icon="Bold" active={!!overrides.fontWeight && overrides.fontWeight >= 700} onClick={() => set({ fontWeight: overrides.fontWeight && overrides.fontWeight >= 700 ? undefined : 700 })} label={t(lang, 'bold')} />
              <ToggleBtn icon="Italic" active={!!overrides.italic} onClick={() => set({ italic: !overrides.italic })} label={t(lang, 'italic')} />
              <ToggleBtn icon="Underline" active={!!overrides.underline} onClick={() => set({ underline: !overrides.underline })} label={t(lang, 'underline')} />
              <ToggleBtn icon="CaseSensitive" active={!!overrides.uppercase} onClick={() => set({ uppercase: !overrides.uppercase })} label={t(lang, 'uppercaseLabel')} />
            </div>
          </Section>
        )}

        {/* -------- colours (swatches) -------- */}
        <Section title={t(lang, 'colours')} icon="Palette">
          {hasText && (
            <Field label={t(lang, 'fontColour')}>
              <ColorInput value={overrides.color} onChange={(v) => set({ color: v || undefined })} allowClear lang={lang} />
            </Field>
          )}
          <Field label={t(lang, 'backgroundColour')}>
            <ColorInput value={overrides.bg} onChange={(v) => set({ bg: v || undefined })} allowClear lang={lang} />
          </Field>
          {isSection && (
            <>
              <Field label={t(lang, 'backgroundColour')} hint={t(lang, 'pickFromPalette')}>
                <ColorInput value={block.style.bg} onChange={(v) => props.onChangeStyle({ bg: v || undefined })} allowClear lang={lang} />
              </Field>
              <ImagePicker
                value={block.style.bgImage}
                onChange={(v) => props.onChangeStyle({ bgImage: v || undefined })}
                media={media}
                onAddMedia={onAddMedia}
                label={t(lang, 'backgroundImage')}
                lang={lang}
              />
              <VideoPicker
                value={block.style.bgVideo}
                onChange={(v) => props.onChangeStyle({ bgVideo: v || undefined })}
                media={media}
                onAddMedia={onAddMedia}
                label={t(lang, 'backgroundVideo')}
                lang={lang}
              />
              {(block.style.bgImage || block.style.bgVideo) && (
                <Slider label={t(lang, 'overlay')} value={block.style.bgOverlay ?? 0} onChange={(v) => props.onChangeStyle({ bgOverlay: v })} min={0} max={0.9} step={0.05} />
              )}
            </>
          )}
        </Section>

        {/* -------- controls from the schema -------- */}
        {groups.controls.length > 0 && (
          <Section title={t(lang, 'settings')} icon="SlidersHorizontal">{groups.controls.map(renderCap)}</Section>
        )}

        {/* -------- size & effects -------- */}
        <Section title={t(lang, 'spacingSection')} icon="Move">
          {isSection ? (
            <Slider label={t(lang, 'sectionPadding')} value={block.style.paddingY ?? 64} onChange={(v) => props.onChangeStyle({ paddingY: v })} min={0} max={160} step={4} unit="px" />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t(lang, 'widthLabel')}>
                  <NumberInput value={overrides.widthPx ?? 0} onChange={(v) => set({ widthPx: v || undefined })} suffix="px" min={0} />
                </Field>
                <Field label={t(lang, 'heightLabel')}>
                  <NumberInput value={overrides.heightPx ?? 0} onChange={(v) => set({ heightPx: v || undefined })} suffix="px" min={0} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t(lang, 'paddingLeftRight')}>
                  <NumberInput value={overrides.paddingX ?? 0} onChange={(v) => set({ paddingX: v || undefined })} suffix="px" min={0} />
                </Field>
                <Field label={t(lang, 'paddingTopBottom')}>
                  <NumberInput value={overrides.paddingY ?? 0} onChange={(v) => set({ paddingY: v || undefined })} suffix="px" min={0} />
                </Field>
                <Field label={t(lang, 'marginTop')}>
                  <NumberInput value={overrides.marginTop ?? 0} onChange={(v) => set({ marginTop: v || undefined })} suffix="px" />
                </Field>
                <Field label={t(lang, 'marginBottom')}>
                  <NumberInput value={overrides.marginBottom ?? 0} onChange={(v) => set({ marginBottom: v || undefined })} suffix="px" />
                </Field>
              </div>
            </>
          )}
          <Slider label={t(lang, 'radius')} value={overrides.radius ?? 0} onChange={(v) => set({ radius: v || undefined })} min={0} max={64} unit="px" />
        </Section>

        <Section title={t(lang, 'effectsSection')} icon="Sparkles">
          <Field label={t(lang, 'shadow')}>
            <Select value={overrides.shadow ?? ''} onChange={(v) => set({ shadow: (v || undefined) as any })} options={SHADOWS} />
          </Field>
          <Slider label={t(lang, 'opacity')} value={overrides.opacity ?? 1} onChange={(v) => set({ opacity: v })} min={0.1} max={1} step={0.05} />
          <Slider label={t(lang, 'borderWidth')} value={overrides.borderWidth ?? 0} onChange={(v) => set({ borderWidth: v || undefined })} min={0} max={12} unit="px" />
          <Field label={t(lang, 'borderColour')}>
            <ColorInput value={overrides.borderColor} onChange={(v) => set({ borderColor: v || undefined })} allowClear lang={lang} compact />
          </Field>
        </Section>

        {/* -------- free position -------- */}
        {!isSection && (
          <Section title={t(lang, 'freeMove')} icon="Move3d">
            <p className="text-[11.5px] leading-relaxed text-ink-400">{t(lang, 'moveHint')}</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="X">
                <NumberInput value={overrides.offsetX ?? 0} onChange={(v) => set({ offsetX: v || undefined })} suffix="px" />
              </Field>
              <Field label="Y">
                <NumberInput value={overrides.offsetY ?? 0} onChange={(v) => set({ offsetY: v || undefined })} suffix="px" />
              </Field>
            </div>
            <Slider label={t(lang, 'size')} value={overrides.scale ?? 1} onChange={(v) => set({ scale: v })} min={0.25} max={3} step={0.05} />
            {moved && (
              <button type="button" className="btn-outline w-full justify-center" onClick={() => set({ offsetX: undefined, offsetY: undefined, scale: undefined })}>
                <Ic n='RotateCcw' size={14} />
                {t(lang, 'resetPosition')}
              </button>
            )}
          </Section>
        )}

        {/* -------- element actions -------- */}
        <Section title={t(lang, 'more')} icon="Ellipsis">
          <div className="flex flex-col gap-2">
            {isSection && props.onMove && (
              <div className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-[var(--surface-2)] p-2.5">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">
                  {props.isCatalogue ? t(lang, 'catalogPosition') : t(lang, 'position')}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button type="button" className="btn-outline justify-center !px-2" disabled={props.canMoveUp === false} onClick={() => props.onMove?.(-1)}>
                    <Ic n='ArrowUp' size={14} />
                    {t(lang, 'moveUpOne')}
                  </button>
                  <button type="button" className="btn-outline justify-center !px-2" disabled={props.canMoveDown === false} onClick={() => props.onMove?.(1)}>
                    <Ic n='ArrowDown' size={14} />
                    {t(lang, 'moveDownOne')}
                  </button>
                  <button type="button" className="btn-outline justify-center !px-2" disabled={props.canMoveUp === false} onClick={() => props.onMoveToEdge?.('top')}>
                    <Ic n='ChevronsUp' size={14} />
                    {t(lang, 'toTop')}
                  </button>
                  <button type="button" className="btn-outline justify-center !px-2" disabled={props.canMoveDown === false} onClick={() => props.onMoveToEdge?.('bottom')}>
                    <Ic n='ChevronsDown' size={14} />
                    {t(lang, 'toBottom')}
                  </button>
                </div>
                <p className="text-[11px] leading-snug text-ink-400">{t(lang, 'dragToReorder')}</p>
              </div>
            )}
            {isSection && (
              <button type="button" className="btn-outline w-full justify-center" onClick={props.onDuplicate}>
                <Ic n='Copy' size={14} />
                {t(lang, 'duplicateBlock')}
              </button>
            )}
            <button type="button" className="btn-outline w-full justify-center" onClick={() => setAdvanced((v) => !v)}>
              <Ic n='Settings2' size={14} />
              {t(lang, 'advancedTab')}
            </button>
            {advanced && (
              <div className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-[var(--surface-2)] p-3">
                {isSection && (
                  <Field label={t(lang, 'animation')}>
                    <Select
                      value={block.style.animation ?? 'none'}
                      onChange={(v) => props.onChangeStyle({ animation: v })}
                      options={[
                        { value: 'none', label: t(lang, 'none') },
                        { value: 'fade-up', label: t(lang, 'fadeUp') },
                        { value: 'fade-in', label: t(lang, 'fadeIn') },
                        { value: 'scale-in', label: t(lang, 'scaleIn') },
                      ]}
                    />
                  </Field>
                )}
                <button type="button" className="btn-outline w-full justify-center" onClick={() => props.onResetElement(elementKey)}>
                  <Ic n='Eraser' size={14} />
                  {t(lang, 'resetLabel')}
                </button>
                {isSection && (
                  <button type="button" className="btn-danger w-full justify-center" onClick={props.onDelete}>
                    <Ic n='Trash2' size={14} />
                    {t(lang, 'deleteSection')}
                  </button>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}

function ToggleBtn({ icon, active, onClick, label }: { icon: string; active: boolean; onClick: () => void; label: string }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        className={cn('inline-flex h-9 w-9 items-center justify-center rounded-xl border transition', active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:bg-ink-100')}
      >
        <Ic n={icon} size={15} />
      </button>
    </Tooltip>
  )
}

/** Small helper: the human label for an element key, for the toolbar. */
export function elementLabelOf(block: Block, def: BlockDefinition | undefined, elementKey: string, lang: Lang): string {
  if (elementKey === 'section') return block.label || (def ? schemaCopy(def.label, lang) : block.type)
  const found = def?.elements.find((e) => e.key === elementKey)
  if (found) return schemaCopy(found.label, lang)
  return elementKey.split('.').slice(0, 2).join(' · ')
}
