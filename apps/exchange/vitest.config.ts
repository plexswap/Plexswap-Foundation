import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const r = (p: string) => resolve(__dirname, p)

export default defineConfig({
  // @ts-ignore
  plugins: [tsconfigPaths({ projects: ['tsconfig.test.json'] }), react(), vanillaExtractPlugin()],
  resolve: {
    alias: {
      '@plexswap/wagmi/connectors/blocto': r('../../packages/wagmi/connectors/blocto/index.ts'),
      '@plexswap/wagmi/connectors/miniProgram': r('../../packages/wagmi/connectors/miniProgram/index.ts'),
      '@plexswap/wagmi/connectors/trustWallet': r('../../packages/wagmi/connectors/trustWallet/index.ts'),
      '@plexswap/ui-plex': r('../../packages/ui-plex/src'),
      '@plexswap/localization': r('../../packages/localization/src'),
    },
  },
  test: {
    setupFiles: ['./vitest.setup.js'],
    environment: 'happy-dom',
    globals: true,
    exclude: ['src/config/__tests__', 'node_modules'],
  },
})
