import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/index',
    'src/vite',
    'src/sw',
  ],
  rollup: {
    emitCJS: true,
  },
})
