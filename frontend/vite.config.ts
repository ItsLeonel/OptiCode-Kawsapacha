import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = loadEnv('', '.', 'KAWSAPACHA_').KAWSAPACHA_API_TARGET || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // expone el dev-server en la IP de red local
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
