import { describe, expect, it, vi } from 'vitest'

import { createFetchServer } from '../src/fetch-server'

const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
}

vi.mock('../src/dev/logger', () => ({
  createLogger: () => logger,
}))

vi.mock('../src/dev/scanner', () => ({
  scanRoutes: vi.fn(() => {
    throw new Error('boom')
  }),
}))

vi.mock('../src/fetch-server/watcher', () => ({
  createWatcher: vi.fn(async () => null),
}))

vi.mock('../src/fetch-server/playground-ws', () => ({
  createPlaygroundWs: () => ({
    handleRouteResponse: vi.fn(),
    setupPlaygroundWebSocket: vi.fn(),
    getWsHandler: vi.fn(() => undefined),
    getInjectWebSocket: vi.fn(() => undefined),
  }),
}))

describe('fetch server refresh errors', () => {
  it('logs scan failures without throwing', async () => {
    const server = await createFetchServer({ entries: { dir: '/tmp/mock' } })
    expect(server.fetch).toBeTypeOf('function')
    expect(logger.error).toHaveBeenCalled()
  })
})
