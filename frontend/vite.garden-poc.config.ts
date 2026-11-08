import { defineConfig, mergeConfig } from 'vite'
import baseConfig from './vite.config'

export default mergeConfig(baseConfig, defineConfig({
  build: {
    outDir: 'dist/garden-poc',
    rollupOptions: { input: 'garden-lab.html' },
  },
}))
