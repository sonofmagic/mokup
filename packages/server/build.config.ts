import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: ['src/index', 'src/worker', 'src/node'],
  rollup: {
    emitCJS: true,
  },
})
