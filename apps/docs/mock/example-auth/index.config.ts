import type { MiddlewareHandler } from 'mokup'
import { defineConfig, onAfterAll, onBeforeAll } from 'mokup'

const requireAuth: MiddlewareHandler = async (c, next) => {
  const header = c.req.header('authorization') ?? ''
  if (!header.startsWith('Bearer ')) {
    c.status(401)
    return c.json({
      ok: false,
      error: 'missing_auth',
    })
  }
  return await next()
}

const attachUser: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-user', 'demo-user')
  await next()
}

const markAuthChecked: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('x-mokup-auth', 'checked')
}

export default defineConfig(({ app }) => {
  onBeforeAll(() => {
    app.use(requireAuth)
  })
  app.use(attachUser)
  onAfterAll(() => {
    app.use(markAuthChecked)
  })

  return {
    headers: {
      'x-mokup-example': 'auth',
    },
  }
})
