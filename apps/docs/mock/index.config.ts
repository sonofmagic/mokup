import type { DirectoryConfig, MockMiddleware } from 'mokup'

const middleware: MockMiddleware = async (c, next) => {
  c.header('x-mokup-middleware', 'enabled')
  return await next()
}

const config: DirectoryConfig = {
  headers: {
    'x-mokup-scope': 'docs',
  },
  delay: 120,
  middleware: [middleware],
}

export default config
