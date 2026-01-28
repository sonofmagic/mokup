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
    'src/config-core',
    'src/config-utils',
    'src/define-config',
    'src/jsonc-utils',
    'src/load-rules',
    'src/mock-files',
    'src/module-loader',
    'src/pathe',
    'src/path-utils',
    'src/playground-grouping',
    'src/route-constants',
    'src/route-utils',
    'src/scan-utils',
    'src/timing',
    'src/jsonc-parser',
  ],
  rollup: {
    emitCJS: true,
  },
})
