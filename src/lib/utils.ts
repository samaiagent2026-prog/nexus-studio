import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Lang, LocalizedText } from './types'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`

export const clone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value) } catch { /* fall through for non-cloneable */ }
  }
  return JSON.parse(JSON.stringify(value)) as T
}

export const isObj = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** Immutable path read: getPath(obj, 'items.0.title') */
export function getPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}

/** Immutable path write returning a structural clone. */
export function setPath<T>(obj: T, path: string, value: any): T {
  const keys = path.split('.')
  const next: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) }
  let cursor = next
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    const child = cursor[k]
    cursor[k] = Array.isArray(child) ? [...child] : isObj(child) ? { ...child } : {}
    cursor = cursor[k]
  }
  cursor[keys[keys.length - 1]] = value
  return next as T
}

export function deletePath<T>(obj: T, path: string): T {
  const keys = path.split('.')
  const next: any = clone(obj)
  let cursor = next
  for (let i = 0; i < keys.length - 1; i++) {
    if (cursor?.[keys[i]] == null) return next
    cursor = cursor[keys[i]]
  }
  const last = keys[keys.length - 1]
  if (Array.isArray(cursor)) cursor.splice(Number(last), 1)
  else delete cursor[last]
  return next
}

export const emptyText = (value?: string): LocalizedText => ({ en: value ?? '', ar: '' })
export const asText = (v: any): LocalizedText =>
  isObj(v) && ('en' in v || 'ar' in v) ? { en: String(v.en ?? ''), ar: String(v.ar ?? '') } : { en: String(v ?? ''), ar: '' }

/** Resolve a localized value for a language, falling back to the other language. */
export function tr(value: any, lang: Lang): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  const en = value.en ?? ''
  const ar = value.ar ?? ''
  if (lang === 'ar') return ar || en
  return en || ar
}

export const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'site'

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const int = parseInt(full || '000000', 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}
export const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
export const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const readableOn = (hex: string) => (luminance(hex) > 0.55 ? '#0b1020' : '#ffffff')

export const formatDate = (ts: number, lang: Lang = 'en') =>
  new Date(ts).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })

export const formatBytes = (bytes = 0) => {
  if (!bytes) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const move = <T,>(arr: T[], from: number, to: number): T[] => {
  const next = [...arr]
  if (from < 0 || from >= next.length) return next
  const [item] = next.splice(from, 1)
  next.splice(clamp(to, 0, next.length), 0, item)
  return next
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const isExternal = (href = '') => /^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')

/** Deterministic pseudo-random pick so previews stay stable between renders. */
export const seededPick = <T,>(arr: T[], seed: number): T => arr[Math.abs(Math.floor(seed)) % arr.length]
