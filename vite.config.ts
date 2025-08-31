import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const base_path = process.env.VITE_APP_BASE_PATH || '';

export default defineConfig({
  plugins: [react()],
   base: base_path,
})
