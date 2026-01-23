import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/cli-bin',
    'src/cli',
    'src/index',
    'src/runtime',
    'src/server',
    'src/server/node',
    'src/server/worker',
    'src/vite',
    'src/webpack',
    'src/sw',
  ],
  rollup: {
    emitCJS: true,
  },
})
