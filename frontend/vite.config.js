import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiUrl = String(env.VITE_API_URL || '').trim().replace(/\/+$/, '')

  if (mode === 'production' && (!apiUrl || !apiUrl.endsWith('/api'))) {
    throw new Error('Production builds require VITE_API_URL to end with /api')
  }

  return {
    plugins: [react(), tailwindcss()],
  }
})
