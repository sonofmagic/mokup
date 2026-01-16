import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/index',
    'src/vite',
  ],
  rollup: {
    emitCJS: true,
  },
})
