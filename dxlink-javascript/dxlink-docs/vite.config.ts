import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/dxscript.backtesting.v1.backtestingservice': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: './build',
  },
  plugins: [react()],
})
