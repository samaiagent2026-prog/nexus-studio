import React from 'react'
import { resolveIcon, Ic } from '../../lib/icons'
import { COLLECTIONS } from '../../lib/collections'
import type { Block, ElementStyle, Lang, MediaAsset } from '../../lib/types'
import type { BlockDefinition, FieldSchema } from '../../lib/schema'
import { cn, deletePath, getPath, move, setPath, tr, uid } from '../../lib/utils'
import { Badge, ColorInput, Field, IconButton, NumberInput, Segmented, Select, Slider, TextArea, TextInput, Toggle, Tooltip } from '../ui'
import { IconPickerButton } from './IconPicker'
import { ImagePicker } from './ImagePicker'
import { blockLabel } from '../../lib/blockCopy'
import { schemaCopy } from '../../lib/schemaCopy'
import { t } from '../../lib/i18n'

/* ============================================================
   Inspector: renders the content schema for the selected block,
   plus a style panel bound to the selected element.
   ============================================================ */

const FONT_OPTIONS = (lang: Lang) => [
  { value: '', label: t(lang, 'inherit') },
  { value: "'Inter', system-ui, sans-serif", label: 'Inter' },
  { value: "'Plus Jakarta Sans', system-ui, sans-serif", label: 'Plus Jakarta' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Georgia' },
  { value: "ui-monospace, 'SF Mono', Menlo, monospace", label: 'Mono' },
  { value: "'IBM Plex Sans Arabic', system-ui, sans-serif", label: 'IBM Plex Arabic' },
  { value: "'Cairo', system-ui, sans-serif", label: 'Cairo' },
]

const SHADOW_OPTIONS = (lang: Lang) => [
  { value: '', label: t(lang, 'none') },
  { value: 'soft', label: t(lang, 'soft') },
  { value: 'lift', label: t(lang, 'lifted') },
  { value: 'glow', label: t(lang, 'glow') },
]

const WEIGHT_OPTIONS = (lang: Lang) => [
  { value: '', label: t(lang, 'inherit') },
  { value: '400', label: t(lang, 'regular') },
  { value: '500', label: t(lang, 'medium') },
  { value: '600', label: t(lang, 'semibold') },
  { value: '700', label: t(lang, 'bold') },
  { value: '800', label: t(lang, 'extrabold') },
  { value: '900', label: t(lang, 'black') },
]

const ANIMATION_OPTIONS = (lang: Lang) => [
  { value: 'none', label: t(lang, 'none') },
  { value: 'fade-up', label: t(lang, 'fadeUp') },
  { value: 'fade-in', label: t(lang, 'fadeIn') },
  { value: 'scale-in', label: t(lang, 'scaleIn') },
]

export interface InspectorProps {
  block: Block
  def?: BlockDefinition
  lang: Lang
  elementKey: string
  media: MediaAsset[]
  onAddMedia: (assets: MediaAsset[]) => void
  onChangeProp: (path: string, value: any) => void
  onChangeElement: (elementKey: string, patch: ElementStyle) => void
  onResetElement: (elementKey: string) => void
  onChangeStyle: (patch: Record<string, any>) => void
  tab: 'content' | 'style' | 'advanced'
  onTab: (tab: 'content' | 'style' | 'advanced') => void
}

export function Inspector(props: InspectorProps) {
  const { block, def, lang, elementKey, tab, onTab } = props

  const elementLabel = React.useMemo(() => {
    if (!def) return t(lang, 'section')
    const found = def.elements.find((e) => e.key === elementKey)
    if (found) return schemaCopy(found.label, lang)
    if (elementKey === 'section') return t(lang, 'sectionWrapper')
    return elementKey.split('.').slice(0, 2).join(' · ')
  }, [def, elementKey, lang])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-[var(--border)] px-3 py-2.5">
        <Segmented
          value={tab}
          onChange={(v) => onTab(v as any)}
          options={[
            { value: 'content', label: t(lang, 'contentTab'), icon: 'FileText' },
            { value: 'style', label: t(lang, 'styleTab'), icon: 'Palette' },
            { value: 'advanced', label: t(lang, 'advancedTab'), icon: 'SlidersHorizontal' },
          ]}
          className="w-full [&>button]:flex-1"
        />
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-ink-800">{elementLabel}</p>
          <p className="truncate text-[10.5px] text-ink-400">{blockLabel(def, lang) || block.type}</p>
        </div>
        <Badge tone={elementKey === 'section' ? 'dark' : 'brand'}>{elementKey === 'section' ? t(lang, 'blockBadge') : t(lang, 'element')}</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5">
        {tab === 'content' && <ContentPanel {...props} />}
        {tab === 'style' && <StylePanel {...props} />}
        {tab === 'advanced' && <AdvancedPanel {...props} />}
      </div>
    </div>
  )
}

/* ---------------- content ---------------- */

const elementKeyOf = (props: InspectorProps) => props.elementKey

function ContentPanel(props: InspectorProps) {
  const { def, block, lang, onChangeProp, media, onAddMedia } = props
  const [query, setQuery] = React.useState('')
  if (!def) return <p className="text-[13px] text-ink-500">{t(lang, 'noEditableSchema')}</p>

  const elementKey = elementKeyOf(props)
  const focusField = def.elements.find((el) => el.key === elementKey)?.fieldKey
  const visibleFields = def.fields
    .filter((f) => !f.when || f.when(block.props))
    .sort((a, b) => {
      if (!focusField) return 0
      const aHit = a.key === focusField || a.key.startsWith(`${focusField}.`) ? 0 : 1
      const bHit = b.key === focusField || b.key.startsWith(`${focusField}.`) ? 0 : 1
      return aHit - bHit
    })
  const groups = Array.from(new Set(visibleFields.map((f) => f.group ?? t(lang, 'general'))))

  const matches = (f: FieldSchema) =>
    !query.trim() || schemaCopy(f.label, lang).toLowerCase().includes(query.toLowerCase()) || f.label.toLowerCase().includes(query.toLowerCase())

  return (
    <div className="flex flex-col gap-4">
      {def.fields.length > 6 && (
        <TextInput value={query} onChange={setQuery} placeholder={t(lang, 'findSetting')} icon="Search" />
      )}
      {groups.map((group) => {
        const fields = visibleFields.filter((f) => (f.group ?? t(lang, 'general')) === group && matches(f))
        if (fields.length === 0) return null
        return (
          <section key={group} className="flex flex-col gap-3.5">
            <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{schemaCopy(group, lang)}</h4>
            {fields.map((field) => (
              <FieldControl key={field.key} field={field} block={block} lang={lang} onChangeProp={onChangeProp} media={media} onAddMedia={onAddMedia} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

function FieldControl({
  field,
  block,
  lang,
  onChangeProp,
  media,
  onAddMedia,
}: {
  field: FieldSchema
  block: Block
  lang: Lang
  onChangeProp: (path: string, value: any) => void
  media: MediaAsset[]
  onAddMedia: (assets: MediaAsset[]) => void
}) {
  const raw = getPath(block.props, field.key)
  const set = (value: any) => onChangeProp(field.key, value)

  switch (field.type) {
    case 'text':
      return <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}><TextInput value={raw ?? ''} onChange={set} placeholder={field.placeholder} /></Field>

    case 'textarea':
      return <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}><TextArea value={raw ?? ''} onChange={set} /></Field>

    case 'localizedText': {
      const value = typeof raw === 'object' && raw !== null ? raw : { en: raw ?? '', ar: '' }
      return (
        <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-6 shrink-0 text-[10px] font-bold uppercase text-ink-400">EN</span>
              <TextInput value={value.en ?? ''} onChange={(v) => set({ ...value, en: v })} placeholder={field.placeholder} />
            </div>
            <div className="flex items-center gap-1.5" dir="rtl">
              <span className="w-6 shrink-0 text-[10px] font-bold uppercase text-ink-400" dir="ltr">AR</span>
              <TextInput value={value.ar ?? ''} onChange={(v) => set({ ...value, ar: v })} />
            </div>
          </div>
        </Field>
      )
    }

    case 'localizedTextarea': {
      const value = typeof raw === 'object' && raw !== null ? raw : { en: raw ?? '', ar: '' }
      return (
        <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-1.5">
              <span className="mt-2 w-6 shrink-0 text-[10px] font-bold uppercase text-ink-400">EN</span>
              <TextArea value={value.en ?? ''} onChange={(v) => set({ ...value, en: v })} rows={3} />
            </div>
            <div className="flex items-start gap-1.5" dir="rtl">
              <span className="mt-2 w-6 shrink-0 text-[10px] font-bold uppercase text-ink-400" dir="ltr">AR</span>
              <TextArea value={value.ar ?? ''} onChange={(v) => set({ ...value, ar: v })} rows={3} />
            </div>
          </div>
        </Field>
      )
    }

    case 'number':
      return <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}><NumberInput value={Number(raw ?? 0)} onChange={set} min={field.min} max={field.max} step={field.step} suffix={field.unit} /></Field>

    case 'slider':
      return (
        <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}>
          <Slider value={Number(raw ?? field.min ?? 0)} onChange={set} min={field.min} max={field.max} step={field.step} unit={field.unit} label={field.label} />
        </Field>
      )

    case 'toggle':
      return <Toggle checked={!!raw} onChange={set} label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)} />

    case 'select':
      return (
        <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}>
          <Select
            value={String(raw ?? field.options?.[0]?.value ?? '')}
            onChange={set}
            options={(field.options ?? []).map((o) => ({ ...o, label: schemaCopy(o.label, lang) }))}
          />
        </Field>
      )

    case 'color':
      return <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}><ColorInput value={raw} onChange={set} allowClear lang={lang} /></Field>

    case 'image':
      return (
        <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}>
          <ImagePicker value={raw} onChange={set} media={media} onAddMedia={onAddMedia} lang={lang} />
        </Field>
      )

    case 'icon':
      return <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}><IconPickerButton value={raw} onChange={set} label={schemaCopy(field.label, lang)} lang={lang} /></Field>

    case 'link':
      return (
        <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}>
          <div className="flex flex-col gap-1.5">
            <TextInput value={raw ?? ''} onChange={set} placeholder={field.placeholder ?? '#pricing'} icon="Link" />
            <div className="flex flex-wrap gap-1">
              {['/', '#pricing', '#contact', '/listings', '/services', '/blog'].map((p) => (
                <button key={p} type="button" onClick={() => set(p)} className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-ink-600 transition hover:bg-brand-100 hover:text-brand-700">
                  {p}
                </button>
              ))}
            </div>
          </div>
        </Field>
      )

    case 'tags': {
      const list: any[] = Array.isArray(raw) ? raw : []
      const isLocalized = field.localized
      const readTag = (t: any) => (isLocalized ? tr(t, lang) : String(t))
      const writeTag = (index: number, v: string) => {
        const next = [...list]
        next[index] = isLocalized ? { ...(typeof list[index] === 'object' ? list[index] : {}), [lang]: v } : v
        set(next)
      }
      return (
        <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}>
          <div className="flex flex-col gap-1.5">
            {list.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <TextInput value={readTag(t)} onChange={(v) => writeTag(i, v)} />
                <button type="button" onClick={() => set(list.filter((_, idx) => idx !== i))} className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50">
                  <Ic n='Trash2' size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set([...list, isLocalized ? { en: '', ar: '' } : ''])} className="btn-outline w-fit">
              <Ic n='Plus' size={14} />
              {t(lang, 'addValue')}
            </button>
          </div>
        </Field>
      )
    }

    case 'collection': {
      const options = [{ value: '', label: 'None (manual items)' }, ...Object.values(COLLECTIONS).map((c) => ({ value: c.key, label: tr(c.label, lang) }))]
      const schema = raw ? COLLECTIONS[raw] : undefined
      return (
        <Field label={schemaCopy(field.label, lang)} hint={field.help ? schemaCopy(field.help, lang) : schema ? `${schema.fields.length} ${t(lang, 'fieldsCount')} · ${tr(schema.description, lang)}` : undefined}>
          <Select value={raw ?? ''} onChange={set} options={options} />
        </Field>
      )
    }

    case 'items': {
      const list: any[] = Array.isArray(raw) ? raw : []
      const itemFields = field.itemFields ?? []
      return (
        <Field label={schemaCopy(field.label, lang)} hint={schemaCopy(field.help, lang)}>
          <div className="flex flex-col gap-2">
            {list.map((item, index) => (
              <ItemEditor
                key={index}
                index={index}
                item={item}
                itemFields={itemFields}
                lang={lang}
                label={field.itemLabel?.(item, index) ?? `${t(lang, 'item')} ${index + 1}`}
                onChange={(next) => set(list.map((it, i) => (i === index ? next : it)))}
                onRemove={() => set(list.filter((_, i) => i !== index))}
                onMove={(dir) => set(move(list, index, index + dir))}
                canUp={index > 0}
                canDown={index < list.length - 1}
                onDuplicate={() => {
                  const copy = JSON.parse(JSON.stringify(item))
                  const next = [...list]
                  next.splice(index + 1, 0, copy)
                  set(next)
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => set([...list, field.itemDefaults ? field.itemDefaults() : {}])}
              className="btn-outline w-full justify-center border-dashed"
            >
              <Ic n='Plus' size={14} />
              {t(lang, 'addItem')} {schemaCopy(field.label, lang)}
            </button>
          </div>
        </Field>
      )
    }

    case 'group': {
      const fields = (field.fields ?? []).filter((f) => !f.when || f.when(block.props))
      return (
        <div className="flex flex-col gap-3.5 rounded-2xl border border-ink-200 bg-[var(--surface-2)] p-3">
          <h5 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-500">{schemaCopy(field.label, lang)}</h5>
          {fields.map((sub) => (
            <FieldControl key={sub.key} field={{ ...sub, key: `${field.key}.${sub.key}` }} block={block} lang={lang} onChangeProp={onChangeProp} media={media} onAddMedia={onAddMedia} />
          ))}
        </div>
      )
    }

    default:
      return null
  }
}

function ItemEditor({
  index,
  item,
  itemFields,
  lang,
  label,
  onChange,
  onRemove,
  onMove,
  canUp,
  canDown,
  onDuplicate,
}: {
  index: number
  item: any
  itemFields: FieldSchema[]
  lang: Lang
  label: string
  onChange: (item: any) => void
  onRemove: () => void
  onMove: (dir: number) => void
  canUp: boolean
  canDown: boolean
  onDuplicate: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const set = (key: string, value: any) => onChange(setPath(item, key, value))

  return (
    <div className={cn('rounded-2xl border bg-white transition', open ? 'border-brand-300 shadow-soft' : 'border-ink-200')}>
      <div className="flex items-center gap-1.5 p-2">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2 text-start">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-[10.5px] font-bold text-ink-600">{index + 1}</span>
          <span className="truncate text-[12.5px] font-semibold text-ink-800">{label}</span>
        </button>
        <IconButton icon="ChevronUp" label={t(lang, 'moveUp')} size="sm" onClick={() => onMove(-1)} disabled={!canUp} />
        <IconButton icon="ChevronDown" label={t(lang, 'moveDown')} size="sm" onClick={() => onMove(1)} disabled={!canDown} />
        <IconButton icon="Copy" label={t(lang, 'duplicateBlock')} size="sm" onClick={onDuplicate} />
        <IconButton icon="Trash2" label={t(lang, 'remove')} size="sm" danger onClick={onRemove} />
        <IconButton icon={open ? 'ChevronUp' : 'ChevronDown'} label={open ? t(lang, 'collapse') : t(lang, 'expand')} size="sm" onClick={() => setOpen((v) => !v)} />
      </div>
      {open && (
        <div className="flex flex-col gap-3 border-t border-[var(--border)] p-3">
          {itemFields.map((sub) => (
            <FieldControl key={sub.key} field={{ ...sub, key: sub.key, group: undefined }} block={{ ...({} as Block), props: item }} lang={'en'} onChangeProp={(path, value) => set(path, value)} media={[]} onAddMedia={() => {}} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- style ---------------- */

function StylePanel({ block, lang, elementKey, onChangeElement, onResetElement, onChangeStyle }: InspectorProps) {
  const overrides: ElementStyle = block.elements?.[elementKey] ?? {}
  const set = (patch: ElementStyle) => onChangeElement(elementKey, patch)
  const isSection = elementKey === 'section'

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h4 className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-400">{t(lang, 'elementStyleHeading')}</h4>
        <button type="button" onClick={() => onResetElement(elementKey)} className="text-[11px] font-bold text-brand-600 hover:underline">
          {t(lang, 'resetLabel')}
        </button>
      </div>

      {/* typography */}
      <section className="flex flex-col gap-3">
        <h5 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600"><Ic n='Type' size={13} /> {t(lang, 'typography')}</h5>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t(lang, 'size')}><NumberInput value={overrides.fontSize ?? 0} onChange={(v) => set({ fontSize: v || undefined })} suffix="px" min={8} max={120} /></Field>
          <Field label={t(lang, 'weight')}>
            <Select
              value={String(overrides.fontWeight ?? '')}
              onChange={(v) => set({ fontWeight: v ? Number(v) : undefined })}
              options={WEIGHT_OPTIONS(lang)}
            />
          </Field>
        </div>
        <Field label={t(lang, 'fontFamily')}><Select value={overrides.fontFamily ?? ''} onChange={(v) => set({ fontFamily: v || undefined })} options={FONT_OPTIONS(lang)} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t(lang, 'lineHeight')}><NumberInput value={overrides.lineHeight ?? 0} onChange={(v) => set({ lineHeight: v || undefined })} step={0.1} min={0.8} max={3} /></Field>
          <Field label={t(lang, 'letterSpacing')}><NumberInput value={overrides.letterSpacing ?? 0} onChange={(v) => set({ letterSpacing: v || undefined })} step={0.1} suffix="px" /></Field>
        </div>
        <Field label={t(lang, 'alignment')}>
          <Segmented
            value={(overrides.textAlign ?? 'left') as any}
            onChange={(v) => set({ textAlign: v as any })}
            options={[
              { value: 'left', icon: 'AlignLeft', title: t(lang, 'left') },
              { value: 'center', icon: 'AlignCenter', title: t(lang, 'center') },
              { value: 'right', icon: 'AlignRight', title: t(lang, 'right') },
              { value: 'justify', icon: 'AlignJustify', title: t(lang, 'justify') },
            ]}
          />
        </Field>
        <div className="flex items-center gap-1.5">
          <StyleToggle icon="Bold" active={!!overrides.fontWeight && overrides.fontWeight >= 700} onClick={() => set({ fontWeight: overrides.fontWeight && overrides.fontWeight >= 700 ? undefined : 700 })} label={t(lang, 'bold')} />
          <StyleToggle icon="Italic" active={!!overrides.italic} onClick={() => set({ italic: !overrides.italic })} label={t(lang, 'italic')} />
          <StyleToggle icon="Underline" active={!!overrides.underline} onClick={() => set({ underline: !overrides.underline })} label={t(lang, 'underline')} />
          <StyleToggle icon="CaseSensitive" active={!!overrides.uppercase} onClick={() => set({ uppercase: !overrides.uppercase })} label={t(lang, 'uppercaseLabel')} />
        </div>
      </section>

      {/* colours */}
      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h5 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600"><Ic n='Palette' size={13} /> {t(lang, 'colour')}</h5>
        <Field label={t(lang, 'textColour')}><ColorInput value={overrides.color} onChange={(v) => set({ color: v || undefined })} allowClear lang={lang} /></Field>
        <Field label={t(lang, 'background')}><ColorInput value={overrides.bg} onChange={(v) => set({ bg: v || undefined })} allowClear lang={lang} /></Field>
      </section>

      {/* spacing */}
      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h5 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600"><Ic n='Move' size={13} /> {t(lang, 'spacing')}</h5>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t(lang, 'paddingLeftRight')}><NumberInput value={overrides.paddingX ?? 0} onChange={(v) => set({ paddingX: v || undefined })} suffix="px" min={0} /></Field>
          <Field label={t(lang, 'paddingTopBottom')}><NumberInput value={overrides.paddingY ?? 0} onChange={(v) => set({ paddingY: v || undefined })} suffix="px" min={0} /></Field>
          <Field label={t(lang, 'marginTop')}><NumberInput value={overrides.marginTop ?? 0} onChange={(v) => set({ marginTop: v || undefined })} suffix="px" /></Field>
          <Field label={t(lang, 'marginBottom')}><NumberInput value={overrides.marginBottom ?? 0} onChange={(v) => set({ marginBottom: v || undefined })} suffix="px" /></Field>
        </div>
        <Field label={t(lang, 'maxWidth')}><NumberInput value={overrides.maxWidth ?? 0} onChange={(v) => set({ maxWidth: v || undefined })} suffix="px" /></Field>
      </section>

      {/* effects */}
      <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
        <h5 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600"><Ic n='Sparkles' size={13} /> {t(lang, 'effects')}</h5>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t(lang, 'radius')}><NumberInput value={overrides.radius ?? 0} onChange={(v) => set({ radius: v || undefined })} suffix="px" min={0} max={64} /></Field>
          <Field label={t(lang, 'opacity')}><NumberInput value={overrides.opacity ?? 1} onChange={(v) => set({ opacity: v })} step={0.05} min={0} max={1} /></Field>
          <Field label={t(lang, 'borderWidth')}><NumberInput value={overrides.borderWidth ?? 0} onChange={(v) => set({ borderWidth: v || undefined })} suffix="px" min={0} max={12} /></Field>
          <Field label={t(lang, 'borderColour')}><ColorInput value={overrides.borderColor} onChange={(v) => set({ borderColor: v || undefined })} allowClear lang={lang} /></Field>
        </div>
        <Field label={t(lang, 'shadow')}><Select value={overrides.shadow ?? ''} onChange={(v) => set({ shadow: (v || undefined) as any })} options={SHADOW_OPTIONS(lang)} /></Field>
      </section>

      {isSection && (
        <section className="flex flex-col gap-3 border-t border-[var(--border)] pt-4">
          <h5 className="flex items-center gap-1.5 text-[11px] font-bold text-ink-600"><Ic n='Layers' size={13} /> {t(lang, 'section')}</h5>
          <Slider label={t(lang, 'sectionPadding')} value={block.style.paddingY ?? 64} onChange={(v) => onChangeStyle({ paddingY: v })} min={0} max={160} step={4} unit="px" />
          <Field label={t(lang, 'background')}><ColorInput value={block.style.bg} onChange={(v) => onChangeStyle({ bg: v || undefined })} allowClear lang={lang} /></Field>
          <ImagePicker
            value={block.style.bgImage}
            onChange={(v) => onChangeStyle({ bgImage: v || undefined })}
            media={[]}
            onAddMedia={() => {}}
            label={t(lang, 'backgroundImage')}
            lang={lang}
          />
          {block.style.bgImage && (
            <Slider label={t(lang, 'overlay')} value={block.style.bgOverlay ?? 0} onChange={(v) => onChangeStyle({ bgOverlay: v })} min={0} max={0.9} step={0.05} />
          )}
          <Field label={t(lang, 'animation')}>
            <Select
              value={block.style.animation ?? 'none'}
              onChange={(v) => onChangeStyle({ animation: v })}
              options={ANIMATION_OPTIONS(lang)}
            />
          </Field>
          <div className="flex flex-col gap-2 rounded-xl bg-[var(--surface-2)] p-2.5">
            <Toggle checked={!!block.style.borderTop} onChange={(v) => onChangeStyle({ borderTop: v })} label={t(lang, 'topBorder')} />
            <Toggle checked={!!block.style.borderBottom} onChange={(v) => onChangeStyle({ borderBottom: v })} label={t(lang, 'bottomBorder')} />
          </div>
        </section>
      )}
    </div>
  )
}

function StyleToggle({ icon, active, onClick, label }: { icon: string; active: boolean; onClick: () => void; label: string }) {
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

/* ---------------- advanced ---------------- */

function AdvancedPanel({ block, lang, onChangeProp, def }: InspectorProps) {
  return (
    <div className="flex flex-col gap-4">
      <Field label={t(lang, 'blockId')} hint={t(lang, 'blockIdHint')}>
        <code className="block truncate rounded-xl bg-ink-100 px-3 py-2 text-[11.5px] font-mono text-ink-600">{block.id}</code>
      </Field>
      <Field label={t(lang, 'blockType')}>
        <code className="block truncate rounded-xl bg-ink-100 px-3 py-2 text-[11.5px] font-mono text-ink-600">{block.type}</code>
      </Field>
      {def && (
        <Field label={t(lang, 'availableElements')} hint={t(lang, 'availableElementsHint')}>
          <div className="flex flex-wrap gap-1.5">
            {def.elements.map((el) => (
              <span key={el.key} className="chip">{schemaCopy(el.label, lang)}</span>
            ))}
          </div>
        </Field>
      )}
      <Field label={t(lang, 'rawProps')} hint={t(lang, 'rawPropsHint')}>
        <TextArea
          rows={10}
          value={JSON.stringify(block.props, null, 2)}
          onChange={(v) => {
            try {
              const parsed = JSON.parse(v)
              if (parsed && typeof parsed === 'object') {
                Object.keys(parsed).forEach((k) => onChangeProp(k, parsed[k]))
              }
            } catch {
              /* ignore invalid JSON while typing */
            }
          }}
        />
      </Field>
    </div>
  )
}
