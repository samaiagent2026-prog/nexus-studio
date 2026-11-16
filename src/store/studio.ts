import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Block, Collections, Device, ElementStyle, Lang, MediaAsset, Page, Site, Selection, ThemeTokens } from '../lib/types'
import { clone, getPath, move, setPath, uid } from '../lib/utils'
import { createBlock, createSite, ensureCollections, type CreateSiteInput } from '../lib/factory'
import { getBlockDef } from '../components/blocks/registry'
import { BRAND_RAMPS } from '../lib/theme'

export type ToastKind = 'success' | 'error' | 'info'
export interface Toast { id: string; kind: ToastKind; message: string }

interface EditorSnapshot { site: Site; selection: Selection | null }

export interface StudioState {
  sites: Site[]
  activeSiteId: string | null
  /** Editing session state (not part of the persisted document). */
  activePageId: string | null
  selection: Selection | null
  device: Device
  lang: Lang
  editMode: boolean
  past: EditorSnapshot[]
  future: EditorSnapshot[]
  toasts: Toast[]
  dirty: boolean

  /* ---------- site CRUD ---------- */
  addSite: (input: CreateSiteInput) => Site
  updateSite: (id: string, patch: Partial<Site>) => void
  deleteSite: (id: string) => void
  duplicateSite: (id: string) => Site | null
  replaceSite: (site: Site) => void
  setActiveSite: (id: string | null) => void

  /* ---------- editor session ---------- */
  setActivePage: (pageId: string) => void
  setDevice: (device: Device) => void
  setLang: (lang: Lang) => void
  setEditMode: (on: boolean) => void
  select: (blockId: string | null, elementKey?: string | null) => void
  selectBlock: (blockId: string) => void

  /* ---------- history ---------- */
  commit: () => void
  undo: () => void
  redo: () => void

  /* ---------- blocks ---------- */
  insertBlock: (type: string, atIndex?: number) => string | null
  removeBlock: (blockId: string) => void
  duplicateBlock: (blockId: string) => void
  moveBlock: (from: number, to: number) => void
  updateBlockProp: (blockId: string, path: string, value: any) => void
  updateBlockStyle: (blockId: string, patch: Record<string, any>) => void
  updateElementStyle: (blockId: string, elementKey: string, patch: ElementStyle) => void
  resetElementStyle: (blockId: string, elementKey: string) => void
  toggleBlockFlag: (blockId: string, flag: 'hidden' | 'locked') => void
  /** Reorder an array-backed element (e.g. a grid item) inside a block. */
  moveItem: (blockId: string, field: string, from: number, to: number) => void
  /** Remove one entry from an array-backed prop (grid item, nav link, …). */
  removeItem: (blockId: string, field: string, index: number) => void
  /** Clone one entry of an array-backed prop directly after the original. */
  duplicateItem: (blockId: string, field: string, index: number) => void
  setBlockLabel: (blockId: string, label: string) => void
  setBlockProps: (blockId: string, props: Record<string, any>) => void

  /* ---------- pages ---------- */
  addPage: (name: string, path: string) => void
  updatePage: (pageId: string, patch: Partial<Page>) => void
  deletePage: (pageId: string) => void

  /* ---------- theme & settings ---------- */
  updateTheme: (patch: Partial<ThemeTokens>) => void
  applyBrandPreset: (preset: string) => void
  updateSettings: (patch: Partial<Site['settings']>) => void
  updateAdmin: (patch: Partial<Site['admin']>) => void

  /* ---------- media ---------- */
  addMedia: (assets: MediaAsset[]) => void
  removeMedia: (id: string) => void

  /* ---------- collections ---------- */
  ensureSiteCollections: () => void
  addRecord: (collection: string, record: Record<string, any>) => void
  updateRecord: (collection: string, index: number, record: Record<string, any>) => void
  deleteRecord: (collection: string, index: number) => void
  replaceCollection: (collection: string, records: Record<string, any>[]) => void

  /* ---------- toasts ---------- */
  toast: (message: string, kind?: ToastKind) => void
  dismissToast: (id: string) => void
}

const MAX_HISTORY = 60

/** Persisted slice only — session state stays in memory. */
type PersistedState = { sites: Site[]; activeSiteId: string | null }

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => {
      /* ---------- internal helpers ---------- */

      const mutateSite = (mutator: (site: Site) => Site, options: { history?: boolean; silent?: boolean } = {}) => {
        const { history = true, silent = false } = options
        const state = get()
        const id = state.activeSiteId
        if (!id) return
        const index = state.sites.findIndex((s) => s.id === id)
        if (index < 0) return
        const current = state.sites[index]
        if (history) {
          state.past.length // no-op to keep linter calm
        }
        // Any block may introduce a new collection binding, so top up seeds
        // whenever a section is added or its settings change.
        const next = { ...mutator(clone(current)), updatedAt: Date.now() }
        next.collections = ensureCollections(next)
        const sites = [...state.sites]
        sites[index] = next
        set({
          sites,
          dirty: true,
          ...(history
            ? { past: [...state.past, { site: clone(current), selection: state.selection ?? null }].slice(-MAX_HISTORY), future: [] }
            : {}),
        })
        if (!silent) {
          // touched for clarity: callers may inspect state.dirty
        }
      }

      const activeSite = () => {
        const { sites, activeSiteId } = get()
        return sites.find((s) => s.id === activeSiteId) ?? null
      }

      const activePage = () => {
        const site = activeSite()
        if (!site) return null
        const { activePageId } = get()
        return site.pages.find((p) => p.id === activePageId) ?? site.pages[0] ?? null
      }

      const mapPageBlocks = (site: Site, pageId: string, fn: (blocks: Block[]) => Block[]): Site => ({
        ...site,
        pages: site.pages.map((p) => (p.id === pageId ? { ...p, blocks: fn(p.blocks) } : p)),
      })

      /** Header and footer live on the site, everything else on a page. */
      const editBlock = (site: Site, blockId: string, fn: (block: Block) => Block): Site => {
        if (site.header.id === blockId) return { ...site, header: fn(site.header) }
        if (site.footer.id === blockId) return { ...site, footer: fn(site.footer) }
        return {
          ...site,
          pages: site.pages.map((p) => ({
            ...p,
            blocks: p.blocks.map((b) => (b.id === blockId ? fn(b) : b)),
          })),
        }
      }

      const findBlock = (site: Site, blockId: string): Block | null => {
        if (site.header.id === blockId) return site.header
        if (site.footer.id === blockId) return site.footer
        for (const p of site.pages) {
          const hit = p.blocks.find((b) => b.id === blockId)
          if (hit) return hit
        }
        return null
      }

      return {
        sites: [],
        activeSiteId: null,
        activePageId: null,
        selection: null,
        device: 'desktop',
        lang: 'en',
        editMode: true,
        past: [],
        future: [],
        toasts: [],
        dirty: false,

        /* ---------- site CRUD ---------- */
        addSite: (input) => {
          const site = createSite(input)
          site.collections = ensureCollections(site)
          set((s) => ({ sites: [site, ...s.sites], activeSiteId: site.id, activePageId: site.pages[0]?.id ?? null, selection: null, past: [], future: [], dirty: false }))
          return site
        },

        updateSite: (id, patch) =>
          set((s) => ({
            sites: s.sites.map((site) => (site.id === id ? { ...site, ...patch, updatedAt: Date.now() } : site)),
          })),

        deleteSite: (id) =>
          set((s) => {
            const sites = s.sites.filter((site) => site.id !== id)
            const wasActive = s.activeSiteId === id
            return {
              sites,
              activeSiteId: wasActive ? sites[0]?.id ?? null : s.activeSiteId,
              activePageId: wasActive ? sites[0]?.pages[0]?.id ?? null : s.activePageId,
              selection: wasActive ? null : s.selection,
            }
          }),

        duplicateSite: (id) => {
          const source = get().sites.find((s) => s.id === id)
          if (!source) return null
          const copy = clone(source)
          copy.id = uid('site')
          copy.name = `${source.name} copy`
          copy.slug = `${source.slug}-copy`
          copy.createdAt = Date.now()
          copy.updatedAt = Date.now()
          copy.pages = copy.pages.map((p) => ({ ...p, id: uid('pg'), blocks: p.blocks.map((b) => ({ ...b, id: uid('blk') })) }))
          copy.header = { ...copy.header, id: uid('blk') }
          copy.footer = { ...copy.footer, id: uid('blk') }
          set((s) => ({ sites: [copy, ...s.sites] }))
          return copy
        },

        replaceSite: (site) =>
          set((s) => ({ sites: s.sites.map((existing) => (existing.id === site.id ? site : existing)) })),

        setActiveSite: (id) =>
          set((s) => {
            const site = s.sites.find((x) => x.id === id) ?? null
            return { activeSiteId: id, activePageId: site?.pages[0]?.id ?? null, selection: null, past: [], future: [] }
          }),

        /* ---------- editor session ---------- */
        setActivePage: (pageId) => set({ activePageId: pageId, selection: null }),
        setDevice: (device) => set({ device }),
        setLang: (lang) => set({ lang }),
        setEditMode: (on) => set({ editMode: on, selection: on ? get().selection : null }),
        select: (blockId, elementKey = null) =>
          set({ selection: blockId ? { blockId, elementKey: elementKey ?? 'section' } : null }),
        selectBlock: (blockId) => set({ selection: { blockId, elementKey: 'section' } }),

        /* ---------- history ---------- */
        commit: () =>
          set((s) => {
            const site = s.sites.find((x) => x.id === s.activeSiteId)
            if (!site) return {}
            return { past: [...s.past, { site: clone(site), selection: s.selection }].slice(-MAX_HISTORY), future: [], dirty: true }
          }),

        undo: () =>
          set((s) => {
            const prev = s.past[s.past.length - 1]
            const currentSite = s.sites.find((x) => x.id === s.activeSiteId)
            if (!prev || !currentSite) return {}
            return {
              past: s.past.slice(0, -1),
              future: [{ site: clone(currentSite), selection: s.selection ?? null }, ...s.future].slice(0, MAX_HISTORY),
              sites: s.sites.map((x) => (x.id === s.activeSiteId ? prev.site : x)),
              selection: prev.selection,
              dirty: true,
            }
          }),

        redo: () =>
          set((s) => {
            const next = s.future[0]
            const currentSite = s.sites.find((x) => x.id === s.activeSiteId)
            if (!next || !currentSite) return {}
            return {
              future: s.future.slice(1),
              past: [...s.past, { site: clone(currentSite), selection: s.selection ?? null }].slice(-MAX_HISTORY),
              sites: s.sites.map((x) => (x.id === s.activeSiteId ? next.site : x)),
              selection: next.selection,
              dirty: true,
            }
          }),

        /* ---------- blocks ---------- */
        insertBlock: (type, atIndex) => {
          const page = activePage()
          if (!page) return null
          const block = createBlock(type)
          if (type === 'header' || type === 'footer') {
            mutateSite((site) => ({ ...site, [type]: block } as Site))
          } else {
            mutateSite((site) =>
              mapPageBlocks(site, page.id, (blocks) => {
                const next = [...blocks]
                next.splice(atIndex ?? next.length, 0, block)
                return next
              }),
            )
          }
          set({ selection: { blockId: block.id, elementKey: 'section' } })
          return block.id
        },

        removeBlock: (blockId) => {
          const site = activeSite()
          if (!site) return
          if (site.header.id === blockId || site.footer.id === blockId) return
          const page = activePage()
          if (!page) return
          mutateSite((s) => mapPageBlocks(s, page.id, (blocks) => blocks.filter((b) => b.id !== blockId)))
          if (get().selection?.blockId === blockId) set({ selection: null })
        },

        duplicateBlock: (blockId) => {
          const page = activePage()
          if (!page) return
          let newId = ''
          mutateSite((site) =>
            mapPageBlocks(site, page.id, (blocks) => {
              const index = blocks.findIndex((b) => b.id === blockId)
              if (index < 0) return blocks
              const copy = clone(blocks[index])
              copy.id = uid('blk')
              newId = copy.id
              const next = [...blocks]
              next.splice(index + 1, 0, copy)
              return next
            }),
          )
          if (newId) set({ selection: { blockId: newId, elementKey: 'section' } })
        },

        moveBlock: (from, to) => {
          const page = activePage()
          if (!page) return
          mutateSite((site) => mapPageBlocks(site, page.id, (blocks) => move(blocks, from, to)))
        },

        updateBlockProp: (blockId, path, value) =>
          mutateSite((site) =>
            editBlock(site, blockId, (b) => ({ ...b, props: setPath(b.props, path, value) })),
            { history: true },
          ),

        updateBlockStyle: (blockId, patch) =>
          mutateSite((site) => editBlock(site, blockId, (b) => ({ ...b, style: { ...b.style, ...patch } }))),

        updateElementStyle: (blockId, elementKey, patch) =>
          mutateSite((site) =>
            editBlock(site, blockId, (b) => ({
              ...b,
              elements: { ...(b.elements ?? {}), [elementKey]: { ...(b.elements?.[elementKey] ?? {}), ...patch } },
            })),
          ),

        resetElementStyle: (blockId, elementKey) =>
          mutateSite((site) =>
            editBlock(site, blockId, (b) => {
              const next = { ...(b.elements ?? {}) }
              delete next[elementKey]
              return { ...b, elements: next }
            }),
          ),

        toggleBlockFlag: (blockId, flag) =>
          mutateSite((site) => editBlock(site, blockId, (b) => ({ ...b, [flag]: !b[flag] }))),

        moveItem: (blockId, field, from, to) =>
          mutateSite((site) =>
            editBlock(site, blockId, (b) => {
              const list = getPath(b.props, field)
              if (!Array.isArray(list)) return b
              return { ...b, props: setPath(b.props, field, move(list, from, to)) }
            }),
          ),

        removeItem: (blockId, field, index) =>
          mutateSite((site) =>
            editBlock(site, blockId, (b) => {
              const list = getPath(b.props, field)
              if (!Array.isArray(list) || index < 0 || index >= list.length) return b
              return { ...b, props: setPath(b.props, field, list.filter((_, i) => i !== index)) }
            }),
          ),

        duplicateItem: (blockId, field, index) =>
          mutateSite((site) =>
            editBlock(site, blockId, (b) => {
              const list = getPath(b.props, field)
              if (!Array.isArray(list) || index < 0 || index >= list.length) return b
              const next = [...list]
              next.splice(index + 1, 0, clone(list[index]))
              return { ...b, props: setPath(b.props, field, next) }
            }),
          ),

        setBlockLabel: (blockId, label) => mutateSite((site) => editBlock(site, blockId, (b) => ({ ...b, label }))),

        setBlockProps: (blockId, props) => mutateSite((site) => editBlock(site, blockId, (b) => ({ ...b, props: { ...b.props, ...props } }))),

        /* ---------- pages ---------- */
        addPage: (name, path) =>
          mutateSite((site) => ({
            ...site,
            pages: [...site.pages, { id: uid('pg'), name: { en: name, ar: name }, path, showInNav: true, blocks: [] }],
          })),

        updatePage: (pageId, patch) =>
          mutateSite((site) => ({ ...site, pages: site.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)) })),

        deletePage: (pageId) =>
          mutateSite((site) => {
            if (site.pages.length <= 1) return site
            return { ...site, pages: site.pages.filter((p) => p.id !== pageId) }
          }),

        /* ---------- theme & settings ---------- */
        updateTheme: (patch) => mutateSite((site) => ({ ...site, theme: { ...site.theme, ...patch } })),

        applyBrandPreset: (preset) => {
          const found = BRAND_RAMPS.find((r) => r.name === preset)
          if (!found) return
          mutateSite((site) => ({ ...site, theme: { ...site.theme, preset, brand: { ...found.ramp } } }))
        },

        updateSettings: (patch) => mutateSite((site) => ({ ...site, settings: { ...site.settings, ...patch } })),

        updateAdmin: (patch) => mutateSite((site) => ({ ...site, admin: { ...site.admin, ...patch } })),

        /* ---------- media ---------- */
        addMedia: (assets) => mutateSite((site) => ({ ...site, media: [...assets, ...site.media] })),
        removeMedia: (id) => mutateSite((site) => ({ ...site, media: site.media.filter((m) => m.id !== id) })),

        /* ---------- collections ---------- */
        ensureSiteCollections: () => mutateSite((site) => ({ ...site, collections: ensureCollections(site) }), { history: false }),

        addRecord: (collection, record) =>
          mutateSite((site) => ({
            ...site,
            collections: { ...site.collections, [collection]: [...(site.collections[collection] ?? []), record] },
          })),

        updateRecord: (collection, index, record) =>
          mutateSite((site) => {
            const list = [...(site.collections[collection] ?? [])]
            list[index] = record
            return { ...site, collections: { ...site.collections, [collection]: list } }
          }),

        deleteRecord: (collection, index) =>
          mutateSite((site) => ({
            ...site,
            collections: { ...site.collections, [collection]: (site.collections[collection] ?? []).filter((_, i) => i !== index) },
          })),

        replaceCollection: (collection, records) =>
          mutateSite((site) => ({ ...site, collections: { ...site.collections, [collection]: records } })),

        /* ---------- toasts ---------- */
        toast: (message, kind = 'success') => {
          const id = uid('toast')
          set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }))
          setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600)
        },
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      }
    },
    {
      name: 'nexus-studio-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({ sites: state.sites, activeSiteId: state.activeSiteId }),
      version: 1,
    },
  ),
)

/* ---------- selectors ---------- */

export const useActiveSite = () => useStudio((s) => s.sites.find((x) => x.id === s.activeSiteId) ?? null)

export const useActivePage = () =>
  useStudio((s) => {
    const site = s.sites.find((x) => x.id === s.activeSiteId)
    if (!site) return null
    return site.pages.find((p) => p.id === s.activePageId) ?? site.pages[0] ?? null
  })

export const useSelectedBlock = () =>
  useStudio((s) => {
    const site = s.sites.find((x) => x.id === s.activeSiteId)
    if (!site || !s.selection) return null
    const { blockId } = s.selection
    if (site.header.id === blockId) return site.header
    if (site.footer.id === blockId) return site.footer
    for (const p of site.pages) {
      const hit = p.blocks.find((b) => b.id === blockId)
      if (hit) return hit
    }
    return null
  })

/** Ordered list of all editable blocks on the current page (header + page + footer). */
export function pageBlocks(site: Site | null, page: Page | null): Block[] {
  if (!site) return []
  return [site.header, ...(page?.blocks ?? []), site.footer]
}

export function blockDefFor(block: Block | null) {
  return block ? getBlockDef(block.type) : undefined
}
