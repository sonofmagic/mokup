import type { MiddlewareHandler } from 'mokup'
import { defineConfig, onAfterAll, onBeforeAll } from 'mokup'

const markRootPre: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-order-root-pre', '1')
  await next()
}

const markRootNormal: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-order-root-normal', '1')
  await next()
}

const markRootPost: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('x-mokup-order-root-post', '1')
}

export default defineConfig(({ app }) => {
  onBeforeAll(() => {
    app.use(markRootPre)
  })
  app.use(markRootNormal)
  onAfterAll(() => {
    app.use(markRootPost)
  })

  return {
    headers: {
      'x-mokup-example': 'order-root',
    },
  }
})
