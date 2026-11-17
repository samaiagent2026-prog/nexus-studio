import type { Block } from './types'
import type { BlockDefinition, FieldSchema } from './schema'
import { getPath } from './utils'

/* ============================================================
   Element → prop capability resolution.

   Given the element the user just clicked, work out which block
   props belong to it (text, image, icon, link, colour, …) so the
   simple panel can surface everything about that element in one
   place without the user hunting through tabs.
   ============================================================ */

export interface Capability {
  path: string
  label: string
  type: FieldSchema['type']
  localized?: boolean
  options?: { value: string; label: string }[]
  min?: number
  max?: number
  step?: number
  unit?: string
  help?: string
}

/** Element keys do not always mirror prop paths; map the known mismatches. */
const KEY_ALIASES: [RegExp, string][] = [
  [/^nav\.(\d+)/, 'links.$1'],
  [/^item\.(\d+)/, 'items.$1'],
  // The announcement-bar phone lives at the bare `phone` prop.
  [/^topbar\.phone$/, 'phone'],
]

export function normalizeKey(key: string): string {
  for (const [re, to] of KEY_ALIASES) if (re.test(key)) return key.replace(re, to)
  return key
}

/**
 * Whether a prop path belongs to the clicked element. Handles the three
 * shapes we care about: exact path, a deeper path under the element, and a
 * sibling field of the same object (so a button click reveals its label/href).
 */
export function pathMatches(elementKey: string, path: string): boolean {
  const key = normalizeKey(elementKey)
  if (path === key || path.startsWith(`${key}.`)) return true
  if (key.startsWith(`${path}.`)) return true
  // camelCase continuation: the `logo` element owns `logoImage`/`logoText`.
  if (path.startsWith(key) && /^[A-Z0-9]/.test(path.slice(key.length))) return true
  // Sub-element keys share the parent's camelCase head: `logo.text` ↔ `logoImage`.
  const head = (s: string) => s.split('.')[0].split(/(?=[A-Z])/)[0].toLowerCase()
  if (key.includes('.') && head(key) === head(path)) return true
  const kp = key.split('.')
  const pp = path.split('.')
  if (kp[0] !== pp[0]) return false
  const ki = kp[1] && /^\d+$/.test(kp[1]) ? kp[1] : null
  const pi = pp[1] && /^\d+$/.test(pp[1]) ? pp[1] : null
  if (ki || pi) return ki === pi
  return true
}

/** Resolve a dotted schema path, descending through items/groups. */
export function findField(fields: FieldSchema[], path: string): FieldSchema | undefined {
  const parts = path.split('.')
  let current = fields
  let found: FieldSchema | undefined
  for (const part of parts) {
    if (/^\d+$/.test(part)) continue
    const next = current.find((f) => f.key === part)
    if (!next) return undefined
    found = next
    if (next.type === 'items' && next.itemFields) current = next.itemFields
    else if (next.type === 'group' && next.fields) current = next.fields
    else current = []
  }
  return found
}

const toCap = (f: FieldSchema, path: string): Capability => ({
  path,
  label: f.label,
  type: f.type,
  localized: f.localized,
  options: f.options,
  min: f.min,
  max: f.max,
  step: f.step,
  unit: f.unit,
  help: f.help,
})

export function capabilitiesFor(block: Block, def: BlockDefinition | undefined, elementKey: string): Capability[] {
  if (!def) return []
  const out: Capability[] = []
  const seen = new Set<string>()

  const push = (f: FieldSchema, path: string) => {
    if (seen.has(path)) return
    seen.add(path)
    out.push(toCap(f, path))
  }

  const walk = (fields: FieldSchema[], prefix: string) => {
    for (const f of fields) {
      const path = prefix ? `${prefix}.${f.key}` : f.key
      if (f.type === 'group' && f.fields) {
        walk(f.fields, path)
        continue
      }
      if (f.type === 'items') {
        const list = getPath(block.props, path)
        const count = Array.isArray(list) ? list.length : 0
        if (f.itemFields) {
          for (let i = 0; i < count; i++) {
            // Only expand the selected instance so the panel stays focused.
            if (elementKey === 'section' || pathMatches(elementKey, `${path}.${i}`)) walk(f.itemFields, `${path}.${i}`)
          }
        }
        continue
      }
      if (elementKey === 'section') {
        if (!path.includes('.')) push(f, path)
        continue
      }
      if (pathMatches(elementKey, path)) push(f, path)
    }
  }

  walk(def.fields, '')

  // The descriptor's fieldKey is authoritative for that element's primary text.
  const desc = def.elements.find((e) => e.key === elementKey)
  if (desc?.fieldKey) {
    const found = findField(def.fields, desc.fieldKey)
    if (found && !seen.has(desc.fieldKey)) {
      seen.add(desc.fieldKey)
      out.unshift(toCap(found, desc.fieldKey))
    }
  }
  return out
}

export const TEXT_TYPES = new Set(['text', 'textarea', 'localizedText', 'localizedTextarea'])
export const CONTROL_TYPES = new Set(['select', 'toggle', 'slider', 'number', 'color'])

export function groupCapabilities(caps: Capability[]) {
  return {
    texts: caps.filter((c) => TEXT_TYPES.has(c.type)),
    images: caps.filter((c) => c.type === 'image'),
    icons: caps.filter((c) => c.type === 'icon'),
    links: caps.filter((c) => c.type === 'link'),
    controls: caps.filter((c) => CONTROL_TYPES.has(c.type)),
  }
}
