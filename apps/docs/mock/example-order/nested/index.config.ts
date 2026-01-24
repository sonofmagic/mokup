import type { MiddlewareHandler } from 'mokup'
import { defineConfig } from 'mokup'

const markNestedPre: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-order-nested-pre', '1')
  await next()
}

const markNestedNormal: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-order-nested-normal', '1')
  await next()
}

const markNestedPost: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('x-mokup-order-nested-post', '1')
}

export default defineConfig(({ pre, normal, post }) => {
  pre.use(markNestedPre)
  normal.use(markNestedNormal)
  post.use(markNestedPost)

  return {
    headers: {
      'x-mokup-example': 'order-nested',
    },
  }
})
