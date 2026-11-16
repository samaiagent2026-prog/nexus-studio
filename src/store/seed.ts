import { instantiateTemplate, blankSite } from '../lib/templates'
import { useStudio } from './studio'

/* ============================================================
   First-run demo content. Seeds three industry sites so the
   dashboard is never empty, and so the client admin panel has
   real data to manage.
   ============================================================ */

export const DEMO_SEEDS = [
  { templateId: 'real-estate', admin: { email: 'admin@skyline.realty', password: 'skyline2026' } },
  { templateId: 'healthcare', admin: { email: 'admin@aurora.health', password: 'aurora2026' } },
  { templateId: 'ecommerce', admin: { email: 'admin@lumen.store', password: 'lumen2026' } },
]

export function seedDemoSites() {
  const state = useStudio.getState()
  if (state.sites.length > 0) return

  const sites = DEMO_SEEDS.map(({ templateId, admin }) =>
    instantiateTemplate(templateId, { adminEmail: admin.email, adminPassword: admin.password }),
  )

  // One extra blank workspace so users can experiment freely.
  const sandbox = blankSite({ name: 'Sandbox', industry: 'General', themePreset: 'violet' })
  sandbox.admin = { email: 'admin@nexus.studio', password: 'admin123', name: 'Site Administrator' }

  useStudio.setState({
    sites: [...sites, sandbox],
    activeSiteId: sites[0].id,
    activePageId: sites[0].pages[0]?.id ?? null,
  })
}

/** Restore the demo workspace (used by a dashboard reset action). */
export function resetStudio() {
  useStudio.setState({ sites: [], activeSiteId: null, activePageId: null, selection: null, past: [], future: [] })
  seedDemoSites()
}
