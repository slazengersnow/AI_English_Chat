import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5001,
    allowedHosts: ["localhost", "127.0.0.1", "0.0.0.0", ".replit.dev", ".kirk.replit.dev"]
  }
})
