import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/banque-fantome/', // ← CHANGE si ton repo s'appelle autrement
})
