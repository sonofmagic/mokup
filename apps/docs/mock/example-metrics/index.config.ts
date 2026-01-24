import type { MiddlewareHandler } from 'mokup'
import { defineConfig } from 'mokup'

const trackDuration: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  await next()
  const elapsed = Date.now() - start
  c.header('x-mokup-duration', `${elapsed}ms`)
}

const addRequestId: MiddlewareHandler = async (c, next) => {
  const id = Math.random().toString(36).slice(2, 8)
  c.header('x-mokup-request-id', id)
  await next()
}

const markMetrics: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('x-mokup-metrics', 'recorded')
}

export default defineConfig(({ pre, normal, post }) => {
  pre.use(trackDuration)
  normal.use(addRequestId)
  post.use(markMetrics)

  return {
    headers: {
      'x-mokup-example': 'metrics',
    },
  }
})
