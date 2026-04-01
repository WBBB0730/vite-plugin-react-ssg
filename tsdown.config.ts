import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/config.ts'],
  platform: 'node',
  dts: true,
  exports: true,
})
