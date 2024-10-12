import { exec } from 'child_process'
import { defineConfig } from 'tsup'

export default defineConfig((options) => ({
  entry: {
    base: 'base/index.ts',
           'config':    'config/index.ts',
           'Aegis':     'Aegis/index.ts',
           'Licentia':  'Licentia/index.ts',
  },
  format: ['esm', 'cjs'],
  skipNodeModulesBundle: true,
  noExternal: ['@plexswap/utils'],
  dts: false,
  treeshake: true,
  splitting: true,
  clean: !options.watch,
  onSuccess: async () => {
    exec('tsc --emitDeclarationOnly --declaration', (err, stdout) => {
      if (err) {
        console.error(stdout)
        if (!options.watch) {
          process.exit(1)
        }
      }
    })
  },
}))
