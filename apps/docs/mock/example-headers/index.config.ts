import type { MiddlewareHandler } from 'mokup'
import { defineConfig } from 'mokup'

const setPreHeaders: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-pre', 'headers')
  c.header('x-mokup-stage', 'pre')
  await next()
}

const setNormalHeaders: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-normal', 'headers')
  c.header('x-mokup-stage', 'normal')
  await next()
}

const setPostHeaders: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('x-mokup-post', 'headers')
  c.header('x-mokup-stage', 'post')
}

export default defineConfig(({ pre, normal, post }) => {
  pre.use(setPreHeaders)
  normal.use(setNormalHeaders)
  post.use(setPostHeaders)

  return {
    headers: {
      'x-mokup-example': 'headers',
    },
  }
})
