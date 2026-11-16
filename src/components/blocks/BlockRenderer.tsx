import React from 'react'
import { getBlockDef } from './registry'
import { BlockCtxProvider, type BlockRenderCtx, type RenderMode } from './context'
import type { Block, CollectionRecord, Device, Lang, Site } from '../../lib/types'
import { dirFor } from '../../lib/dir'

import {
  AnnouncementRenderer,
  FooterRenderer,
  HeaderRenderer,
} from './render/layout'
import {
  CtaBandRenderer,
  HeroRenderer,
  HeroSearchRenderer,
  SpacerRenderer,
} from './render/structure'
import {
  FeatureGridRenderer,
  GalleryRenderer,
  ImageTextRenderer,
  RichTextRenderer,
  StatsRenderer,
  StepsRenderer,
  TabsRenderer,
} from './render/content'
import {
  AccordionRenderer,
  BookingRenderer,
  ListingGridRenderer,
  PricingRenderer,
  TeamRenderer,
  TestimonialsRenderer,
} from './render/data'
import {
  BannerRenderer,
  BlogRenderer,
  ContactRenderer,
  CtaBannerRenderer,
  EventsRenderer,
  LogosRenderer,
  MapLocationsRenderer,
  MenuRenderer,
  NewsletterRenderer,
  SocialFollowRenderer,
  TableRenderer,
  VideoRenderer,
} from './render/utility'

/* ============================================================
   Block dispatcher. Renders any block by type inside the shared
   context, in edit / preview / public mode.
   ============================================================ */

const RENDERERS: Record<string, React.ComponentType> = {
  header: HeaderRenderer,
  footer: FooterRenderer,
  announcement: AnnouncementRenderer,
  hero: HeroRenderer,
  heroSearch: HeroSearchRenderer,
  ctaBand: CtaBandRenderer,
  spacer: SpacerRenderer,
  richText: RichTextRenderer,
  imageText: ImageTextRenderer,
  stats: StatsRenderer,
  steps: StepsRenderer,
  tabs: TabsRenderer,
  featureGrid: FeatureGridRenderer,
  gallery: GalleryRenderer,
  listingGrid: ListingGridRenderer,
  booking: BookingRenderer,
  team: TeamRenderer,
  testimonials: TestimonialsRenderer,
  pricing: PricingRenderer,
  accordion: AccordionRenderer,
  logos: LogosRenderer,
  contact: ContactRenderer,
  newsletter: NewsletterRenderer,
  mapLocations: MapLocationsRenderer,
  blog: BlogRenderer,
  banner: BannerRenderer,
  table: TableRenderer,
  video: VideoRenderer,
  menu: MenuRenderer,
  events: EventsRenderer,
  ctaBanner: CtaBannerRenderer,
  socialFollow: SocialFollowRenderer,
}

export interface BlockRendererProps {
  site: Site
  block: Block
  lang: Lang
  mode: RenderMode
  device?: Device
  selection?: BlockRenderCtx['selection']
  onSelect?: (blockId: string, elementKey: string) => void
  onPropChange?: (path: string, value: any) => void
  onElementStyle?: (elementKey: string, patch: Record<string, any>) => void
  onNavigate?: (to: string) => void
}

export function BlockRenderer({
  site,
  block,
  lang,
  mode,
  device = 'desktop',
  selection = null,
  onSelect,
  onPropChange,
  onElementStyle,
  onNavigate,
}: BlockRendererProps) {
  const Renderer = RENDERERS[block.type]
  const ctx: BlockRenderCtx = React.useMemo(
    () => ({
      site,
      block,
      lang,
      dir: dirFor(lang),
      mode,
      device,
      selection,
      select: (blockId, elementKey) => onSelect?.(blockId, elementKey),
      updateProp: (path, value) => onPropChange?.(path, value),
      updateElement: (elementKey, patch) => onElementStyle?.(elementKey, patch),
      records: (key: string): CollectionRecord[] => site.collections?.[key] ?? [],
      href: (to: string) => (mode === 'edit' ? '#' : to || '#'),
      navigate: (to: string) => {
        if (mode === 'edit') return
        onNavigate?.(to)
      },
    }),
    [site, block, lang, mode, device, selection, onSelect, onPropChange, onElementStyle, onNavigate],
  )

  if (!Renderer) {
    return (
      <div className="mx-auto my-6 max-w-2xl rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-sm font-semibold text-amber-800">
        Unknown block type “{block.type}”
      </div>
    )
  }

  return (
    <BlockCtxProvider value={ctx}>
      <Renderer />
    </BlockCtxProvider>
  )
}

export const BLOCK_RENDERER_TYPES = Object.keys(RENDERERS)

export const blockLabelFor = (block: Block) => block.label || getBlockDef(block.type)?.label || block.type
