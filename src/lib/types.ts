/* ============================================================
   Nexus Studio — domain model
   ============================================================ */

export type Lang = 'en' | 'ar'
export type Dir = 'ltr' | 'rtl'

/** A string that exists once per supported language. */
export interface LocalizedText {
  en: string
  ar: string
}

/** Arbitrary block payload. The inspector drives its shape through a FieldSchema. */
export type BlockProps = Record<string, any>

/** Inline style overrides for a single element inside a block. */
export interface ElementStyle {
  color?: string
  bg?: string
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  italic?: boolean
  underline?: boolean
  uppercase?: boolean
  paddingX?: number
  paddingY?: number
  marginTop?: number
  marginBottom?: number
  radius?: number
  borderWidth?: number
  borderColor?: string
  shadow?: 'none' | 'soft' | 'lift' | 'glow'
  opacity?: number
  maxWidth?: number
  hidden?: boolean
  /** Free positioning: pixels the element is nudged from its natural spot. */
  offsetX?: number
  offsetY?: number
  /** Explicit box size, set by dragging the edge handles. */
  widthPx?: number
  heightPx?: number
  /** Visual scale applied on top of the natural size (drag the resize grip). */
  scale?: number
}

export interface BlockStyle {
  bg?: string
  bgImage?: string
  bgOverlay?: number
  bgSize?: 'cover' | 'contain' | 'auto'
  /** Looping muted background video (URL or uploaded data URL). */
  bgVideo?: string
  /** Still frame shown while the video loads. */
  bgVideoPoster?: string
  paddingY?: number
  paddingX?: number
  radius?: number
  borderTop?: boolean
  borderBottom?: boolean
  fullBleed?: boolean
  contentWidth?: number
  align?: 'left' | 'center' | 'right'
  gap?: number
  animation?: 'none' | 'fade-up' | 'fade-in' | 'scale-in'
}

export interface Block {
  id: string
  type: string
  /** Optional user-facing label shown in the layers panel. */
  label?: string
  hidden?: boolean
  locked?: boolean
  props: BlockProps
  style: BlockStyle
  /** elementKey -> style overrides */
  elements?: Record<string, ElementStyle>
}

export interface Page {
  id: string
  name: LocalizedText
  path: string
  icon?: string
  seo?: { title?: LocalizedText; description?: LocalizedText }
  blocks: Block[]
  showInNav?: boolean
}

export type CollectionFieldType = 'text' | 'longtext' | 'image' | 'number' | 'price' | 'boolean' | 'select' | 'date' | 'tags' | 'url'
export interface CollectionField {
  key: string
  label: LocalizedText
  type: CollectionFieldType
  options?: string[]
  localized?: boolean
  required?: boolean
  placeholder?: LocalizedText
}
export interface CollectionSchema {
  key: string
  label: LocalizedText
  icon: string
  description: LocalizedText
  titleField: string
  fields: CollectionField[]
}
export type CollectionRecord = Record<string, any>
export type Collections = Record<string, CollectionRecord[]>

export interface MediaAsset {
  id: string
  name: string
  url: string
  kind: 'image' | 'video' | 'file'
  size?: number
  createdAt: number
}

export interface ThemeTokens {
  preset: string
  brand: Record<string, string>
  fontSans: string
  fontDisplay: string
  radius: number
  mode: 'light' | 'dark'
  pageBg: string
  containerWidth: number
}

export interface SiteSettings {
  languages: Lang[]
  defaultLang: Lang
  seo: { title: LocalizedText; description: LocalizedText; keywords: string }
  favicon?: string
  analyticsId?: string
  announcement?: LocalizedText
  announcementOn?: boolean
  published: boolean
  customDomain?: string
}

export interface Site {
  id: string
  name: string
  slug: string
  industry: string
  logo?: string
  theme: ThemeTokens
  settings: SiteSettings
  pages: Page[]
  collections: Collections
  media: MediaAsset[]
  header: Block
  footer: Block
  admin: { email: string; password: string; name: string }
  createdAt: number
  updatedAt: number
}

export interface Selection {
  blockId: string
  elementKey: string
}

export type Device = 'desktop' | 'tablet' | 'mobile'
