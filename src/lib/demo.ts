import { instantiateTemplate, blankSite } from './templates'
import type { Site } from './types'

/* ============================================================
   First-run demo content. Kept free of the Zustand store so the
   build script can instantiate the same sites under Node and
   render them to static HTML, while the app uses them to seed an
   empty workspace.
   ============================================================ */

export interface DemoSeed {
  templateId: string
  admin: { email: string; password: string }
}

export const DEMO_SEEDS: DemoSeed[] = [
  { templateId: 'real-estate', admin: { email: 'admin@skyline.realty', password: 'skyline2026' } },
  { templateId: 'healthcare', admin: { email: 'admin@aurora.health', password: 'aurora2026' } },
  { templateId: 'ecommerce', admin: { email: 'admin@lumen.store', password: 'lumen2026' } },
]

/** Instantiate the demo sites (plus a blank sandbox) with no side effects. */
export function buildDemoSites(): Site[] {
  const sites = DEMO_SEEDS.map(({ templateId, admin }) =>
    instantiateTemplate(templateId, { adminEmail: admin.email, adminPassword: admin.password }),
  )

  // One extra blank workspace so users can experiment freely.
  const sandbox = blankSite({ name: 'Sandbox', industry: 'General', themePreset: 'violet' })
  sandbox.admin = { email: 'admin@nexus.studio', password: 'admin123', name: 'Site Administrator' }

  return [...sites, sandbox]
}
