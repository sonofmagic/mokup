import { describe, expect, it, vi } from 'vitest'
import { addMiddlewareFirst } from '../src/vite/plugin/middleware'

describe('vite middleware helpers', () => {
  it('pushes middleware onto stack when available', () => {
    const handler = vi.fn()
    const server = {
      middlewares: {
        stack: [] as Array<{ route: string, handle: typeof handler }>,
        use: vi.fn(),
      },
    }

    addMiddlewareFirst(server as any, handler as any)
    expect(server.middlewares.stack[0]?.handle).toBe(handler)
    expect(server.middlewares.use).not.toHaveBeenCalled()
  })

  it('falls back to middleware.use when stack is missing', () => {
    const handler = vi.fn()
    const server = {
      middlewares: {
        use: vi.fn(),
      },
    }

    addMiddlewareFirst(server as any, handler as any)
    expect(server.middlewares.use).toHaveBeenCalledWith(handler)
  })
})
