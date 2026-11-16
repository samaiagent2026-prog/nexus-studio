import type { FieldSchema } from '../../../lib/schema'

/* ============================================================
   Helpers shared by every block definition.
   Demo imagery uses deterministic seeded URLs so previews are
   stable between renders and always resolve.
   ============================================================ */

export const img = (seed: string, w = 1200, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`

export const T = (en: string, ar: string) => ({ en, ar })

export const cta = (
  labelEn: string,
  labelAr: string,
  href = '#',
  variant = 'primary',
  icon = '',
  iconRight = 'ArrowRight',
) => ({ label: T(labelEn, labelAr), href, variant, size: 'lg', hover: 'lift', icon, iconRight })

/* ---------- reusable field fragments ---------- */

export const linkFields = (key: string, label = 'Button', group = 'Actions'): FieldSchema[] => [
  { key: `${key}.label`, label: `${label} label`, type: 'localizedText', group },
  { key: `${key}.href`, label: `${label} link`, type: 'link', group, placeholder: '#pricing or https://…' },
  {
    key: `${key}.variant`, label: `${label} style`, type: 'select', group,
    options: [
      { value: 'primary', label: 'Primary' },
      { value: 'gradient', label: 'Gradient' },
      { value: 'secondary', label: 'Soft' },
      { value: 'outline', label: 'Outline' },
      { value: 'ghost', label: 'Ghost' },
      { value: 'dark', label: 'Dark' },
      { value: 'glass', label: 'Glass' },
      { value: 'link', label: 'Text link' },
    ],
  },
  {
    key: `${key}.size`, label: `${label} size`, type: 'select', group,
    options: [
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
      { value: 'xl', label: 'Extra large' },
    ],
  },
  {
    key: `${key}.hover`, label: `${label} hover`, type: 'select', group,
    options: [
      { value: 'lift', label: 'Lift' },
      { value: 'grow', label: 'Grow' },
      { value: 'glow', label: 'Glow' },
      { value: 'none', label: 'None' },
    ],
  },
  { key: `${key}.icon`, label: `${label} icon`, type: 'icon', group },
]

export const headingFields = (
  opts: { eyebrow?: boolean; subtitle?: boolean; align?: boolean } = { eyebrow: true, subtitle: true, align: true },
): FieldSchema[] => {
  const fields: FieldSchema[] = []
  if (opts.eyebrow) fields.push({ key: 'eyebrow', label: 'Eyebrow', type: 'localizedText', group: 'Heading' })
  fields.push({ key: 'heading', label: 'Heading', type: 'localizedText', group: 'Heading' })
  if (opts.subtitle) fields.push({ key: 'subheading', label: 'Subheading', type: 'localizedTextarea', group: 'Heading' })
  if (opts.align)
    fields.push({
      key: 'align', label: 'Alignment', type: 'select', group: 'Heading',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
    })
  return fields
}

export const iconFields: FieldSchema[] = [
  { key: 'icon', label: 'Icon', type: 'icon', group: 'Icon' },
  {
    key: 'iconTone', label: 'Icon style', type: 'select', group: 'Icon',
    options: [
      { value: 'soft', label: 'Soft' },
      { value: 'brand', label: 'Solid' },
      { value: 'outline', label: 'Outline' },
      { value: 'glass', label: 'Glass' },
    ],
  },
]

export const itemFieldsBasic: FieldSchema[] = [
  { key: 'icon', label: 'Icon', type: 'icon' },
  { key: 'title', label: 'Title', type: 'localizedText' },
  { key: 'text', label: 'Text', type: 'localizedTextarea' },
  { key: 'href', label: 'Link', type: 'link' },
  { key: 'image', label: 'Image', type: 'image' },
]

export const alignField = (key = 'align', group = 'Layout'): FieldSchema => ({
  key, label: 'Alignment', type: 'select', group,
  options: [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
  ],
})

export const collectionField = (group = 'Data'): FieldSchema => ({
  key: 'collection', label: 'Collection', type: 'collection', group,
  help: 'Pull records from the CMS collection of the same name.',
})
