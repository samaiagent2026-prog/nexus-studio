import { buildDemoSites } from '../lib/demo'
import { useStudio } from './studio'

/* ============================================================
   Seeding the workspace from the shared demo definitions.
   ============================================================ */

export { DEMO_SEEDS } from '../lib/demo'

export function seedDemoSites() {
  const state = useStudio.getState()
  if (state.sites.length > 0) return

  const sites = buildDemoSites()

  useStudio.setState({
    sites,
    activeSiteId: sites[0].id,
    activePageId: sites[0].pages[0]?.id ?? null,
  })
}

/** Restore the demo workspace (used by a dashboard reset action). */
export function resetStudio() {
  useStudio.setState({ sites: [], activeSiteId: null, activePageId: null, selection: null, past: [], future: [] })
  seedDemoSites()
}
