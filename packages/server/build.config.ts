import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/index',
    'src/node',
    'src/connect',
    'src/express',
    'src/koa',
    'src/fastify',
    'src/fetch',
    'src/worker',
    'src/worker-node',
    'src/fetch-server',
    'src/hono',
  ],
  rollup: {
    emitCJS: true,
  },
})
