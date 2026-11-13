import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{
            debugName: 'dependencies',
            name(id) {
              if (!id.includes('node_modules')) return null
              if (/[\\/]node_modules[\\/](react|react-dom|react-is|scheduler)[\\/]/.test(id)) return 'react'
              if (/[\\/]node_modules[\\/](@mui|@emotion)[\\/]/.test(id)) return 'ui'
              return 'vendor'
            },
          }],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    setupFiles: ['./src/test/setup.ts'],
  },
})
