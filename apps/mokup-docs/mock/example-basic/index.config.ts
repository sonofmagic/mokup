import type { MiddlewareHandler } from 'mokup'
import { defineConfig, onAfterAll, onBeforeAll } from 'mokup'

const addPreHeader: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-pre', 'example-basic')
  await next()
}

const addNormalHeader: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-normal', 'example-basic')
  await next()
}

const addPostHeader: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('x-mokup-post', 'example-basic')
}

export default defineConfig(({ app }) => {
  onBeforeAll(() => {
    app.use(addPreHeader)
  })
  app.use(addNormalHeader)
  onAfterAll(() => {
    app.use(addPostHeader)
  })

  return {
    headers: {
      'x-mokup-example': 'basic',
    },
  }
})
