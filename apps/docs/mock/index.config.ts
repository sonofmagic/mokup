import type { MiddlewareHandler, RouteDirectoryConfig } from 'mokup'

const middleware: MiddlewareHandler = async (c, next) => {
  c.header('x-mokup-middleware', 'enabled')
  return await next()
}

const config: RouteDirectoryConfig = {
  headers: {
    'x-mokup-scope': 'docs',
  },
  delay: 120,
  middleware: [middleware],
}

export default config
