import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/index',
    'src/chokidar',
    'src/esbuild',
    'src/hono',
    'src/logger',
    'src/logger.browser',
    'src/pathe',
    'src/path-utils',
    'src/playground-grouping',
    'src/timing',
    'src/jsonc-parser',
  ],
  rollup: {
    emitCJS: true,
  },
})
