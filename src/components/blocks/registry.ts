import type { BlockCategory, BlockDefinition } from '../../lib/schema'
import { announcementBlock, footerBlock, headerBlock, heroBlock } from './defs/header'
import { contentBlocks } from './defs/content'
import { structureBlocks } from './defs/structure'
import { dataBlocks } from './defs/data'
import { trustBlocks } from './defs/utility'

export const ALL_BLOCKS: BlockDefinition[] = [
  headerBlock,
  footerBlock,
  heroBlock,
  announcementBlock,
  ...structureBlocks,
  ...contentBlocks,
  ...dataBlocks,
  ...trustBlocks,
]

export const BLOCK_MAP: Record<string, BlockDefinition> = Object.fromEntries(
  ALL_BLOCKS.map((b) => [b.type, b]),
)

export const getBlockDef = (type: string): BlockDefinition | undefined => BLOCK_MAP[type]

/** Section blocks are the ones a user can insert into a page. */
export const SECTION_BLOCKS = ALL_BLOCKS.filter((b) => b.type !== 'header' && b.type !== 'footer')

export const CATEGORY_ORDER: BlockCategory[] = [
  'structure',
  'content',
  'commerce',
  'people',
  'trust',
  'conversion',
  'utility',
]

export function blocksByCategory(): { category: BlockCategory; blocks: BlockDefinition[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    blocks: SECTION_BLOCKS.filter((b) => b.category === category),
  })).filter((g) => g.blocks.length > 0)
}

export { ALL_BLOCKS as BLOCKS }
