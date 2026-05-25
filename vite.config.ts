import { defineConfig, loadEnv } from 'vite'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig(({ mode }) => {
  // Load all env vars (no prefix) into process.env so server routes can read
  // SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, etc. Do NOT expose to client.
  const serverEnv = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, serverEnv)

  return {
    plugins: [
      TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
      react(),
      tsconfigPaths(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // Pin entities to v4.5.0 (hoisted copy) for @react-email/components SSR
        'entities/lib/decode.js': path.resolve(__dirname, 'node_modules/entities/lib/decode.js'),
        'entities/lib/encode.js': path.resolve(__dirname, 'node_modules/entities/lib/encode.js'),
        entities: path.resolve(__dirname, 'node_modules/entities'),
      },
    },
    build: {
      outDir: 'dist/client',
      emptyOutDir: true,
    },
    server: {
      host: true,
      port: 5173,
      strictPort: true,
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
    },
  }
})
