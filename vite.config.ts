import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
