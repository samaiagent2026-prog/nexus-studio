import type { BlockProps } from './types'

/* ============================================================
   Declarative field schema. The inspector renders these
   descriptors, so every block becomes editable without bespoke
   UI code, and inline click-to-edit can resolve a control for
   any element key.
   ============================================================ */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'localizedText'
  | 'localizedTextarea'
  | 'number'
  | 'slider'
  | 'toggle'
  | 'select'
  | 'color'
  | 'image'
  | 'icon'
  | 'link'
  | 'items'
  | 'tags'
  | 'group'
  | 'collection'

export interface SelectOption { value: string; label: string }

export interface FieldSchema {
  key: string
  label: string
  type: FieldType
  help?: string
  group?: string
  /** Conditional visibility driven by the current block props. */
  when?: (props: BlockProps) => boolean
  options?: SelectOption[]
  min?: number
  max?: number
  step?: number
  unit?: string
  /** Nested controls for type: 'items' */
  itemFields?: FieldSchema[]
  itemDefaults?: () => BlockProps
  itemLabel?: (item: BlockProps, index: number) => string
  /** Nested controls for type: 'group' */
  fields?: FieldSchema[]
  placeholder?: string
  /** For 'tags': whether values are localized objects. */
  localized?: boolean
}

/** Element descriptor exposed to the layers tree + inline editing. */
export interface ElementDescriptor {
  key: string
  label: string
  /** Field that backs this element's primary content, if any. */
  fieldKey?: string
}

export interface BlockDefinition {
  type: string
  label: string
  category: BlockCategory
  icon: string
  description: string
  defaults: () => BlockProps
  fields: FieldSchema[]
  elements: ElementDescriptor[]
}

export type BlockCategory =
  | 'layout'
  | 'structure'
  | 'content'
  | 'commerce'
  | 'people'
  | 'trust'
  | 'conversion'
  | 'utility'

export const CATEGORY_LABELS: Record<BlockCategory, { en: string; ar: string }> = {
  layout: { en: 'Layout', ar: 'التخطيط' },
  structure: { en: 'Structure', ar: 'الهيكل' },
  content: { en: 'Content', ar: 'المحتوى' },
  commerce: { en: 'Commerce', ar: 'التجارة' },
  people: { en: 'People', ar: 'الأشخاص' },
  trust: { en: 'Social proof', ar: 'الإثبات الاجتماعي' },
  conversion: { en: 'Conversion', ar: 'التحويل' },
  utility: { en: 'Utility', ar: 'أدوات' },
}

/** Collect every field in a schema, flattened (including nested item/group fields). */
export function flattenFields(fields: FieldSchema[]): FieldSchema[] {
  const out: FieldSchema[] = []
  for (const f of fields) {
    out.push(f)
    if (f.type === 'items' && f.itemFields) out.push(...flattenFields(f.itemFields).map((c) => ({ ...c, key: `items.*.${c.key}` })))
    if (f.type === 'group' && f.fields) out.push(...flattenFields(f.fields).map((c) => ({ ...c, key: `${f.key}.${c.key}` })))
  }
  return out
}

export const groupLabel = (key: string, fields: FieldSchema[]) =>
  fields.find((f) => f.key === key)?.group ?? key
