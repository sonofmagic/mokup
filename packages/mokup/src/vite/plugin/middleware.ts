import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PreviewServer, ViteDevServer } from 'vite'

type MiddlewareHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void

interface MiddlewareStackEntry {
  route: string
  handle: MiddlewareHandler
}

interface MiddlewareWithStack {
  stack: MiddlewareStackEntry[]
}

function hasMiddlewareStack(
  middlewares: ViteDevServer['middlewares'] | PreviewServer['middlewares'],
): middlewares is ViteDevServer['middlewares'] & MiddlewareWithStack {
  const candidate = middlewares as { stack?: unknown }
  return Array.isArray(candidate.stack)
}

function addMiddlewareFirst(
  server: ViteDevServer | PreviewServer,
  middleware: MiddlewareHandler,
) {
  if (hasMiddlewareStack(server.middlewares)) {
    server.middlewares.stack.unshift({ route: '', handle: middleware })
    return
  }
  server.middlewares.use(middleware)
}

export type { MiddlewareHandler }
export { addMiddlewareFirst }
