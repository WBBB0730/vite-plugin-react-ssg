/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: './playground',
  plugins: [react()],
  test: {
    root: '.',
    environment: 'node',
  },
})
