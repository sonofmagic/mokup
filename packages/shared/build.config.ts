import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/index',
    'src/chokidar',
    'src/esbuild',
    'src/hono',
    'src/pathe',
    'src/jsonc-parser',
  ],
  rollup: {
    emitCJS: true,
  },
})
