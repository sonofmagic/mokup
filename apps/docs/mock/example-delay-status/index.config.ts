import type { MiddlewareHandler } from 'mokup'
import { defineConfig } from 'mokup'

const markDelay: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-delay', '120')
  await next()
}

const markStatus: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-status', '202')
  await next()
}

const markPost: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('x-mokup-post', 'done')
}

export default defineConfig(({ pre, normal, post }) => {
  pre.use(markDelay)
  normal.use(markStatus)
  post.use(markPost)

  return {
    delay: 120,
    headers: {
      'x-mokup-example': 'delay-status',
    },
  }
})
