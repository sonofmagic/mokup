import type { MiddlewareHandler } from 'mokup'
import { defineConfig } from 'mokup'

const middleware: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-middleware', 'enabled')
  return await next()
}

export default defineConfig(({ app }) => {
  app.use(middleware)

  return {
    headers: {
      'x-mokup-scope': 'docs',
    },
    delay: 120,
  }
})
