import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Serve `/sites/<slug>/` as that folder's `index.html`.
 *
 * The generated sites live in `public/sites/` as plain files, but both the dev
 * server and `vite preview` treat a trailing-slash path as a client route and
 * answer with the SPA shell. Rewriting the request to the explicit
 * `index.html` (registered before the static handler) keeps the pretty URL
 * while returning the real page.
 */
function staticDirIndex() {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    const [path, query] = (req.url ?? '').split('?')
    if (path.startsWith('/sites/') && path.endsWith('/')) {
      req.url = `${path}index.html${query ? `?${query}` : ''}`
    }
    next()
  }
  return {
    name: 'nexus-static-dir-index',
    configureServer(server: { middlewares: { use: (fn: typeof rewrite) => void } }) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server: { middlewares: { use: (fn: typeof rewrite) => void } }) {
      server.middlewares.use(rewrite)
    },
  }
}

export default defineConfig({
  plugins: [react(), staticDirIndex()],
  server: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: false,
    // Public preview hosts provided by the runtime; Vite rejects unknown Host headers.
    allowedHosts: ['.prod-runtime.all-hands.dev', 'localhost', '127.0.0.1'],
  },
  preview: {
    host: '0.0.0.0',
    port: 12000,
    strictPort: false,
    allowedHosts: ['.prod-runtime.all-hands.dev', 'localhost', '127.0.0.1'],
  },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1600 },
})
