import type { MiddlewareHandler } from 'mokup'
import { defineConfig } from 'mokup'

const markPre: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-error-pre', '1')
  await next()
}

const markNormal: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-error-normal', '1')
  await next()
}

const handleErrors: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  }
  catch (_error) {
    c.status(500)
    c.header('x-mokup-error', 'handled')
    return c.json({
      ok: false,
      error: 'mock_error',
    })
  }
}

export default defineConfig(({ pre, normal, post }) => {
  pre.use(markPre)
  normal.use(markNormal)
  post.use(handleErrors)

  return {
    headers: {
      'x-mokup-example': 'errors',
    },
  }
})
