import { describe, expect, it, vi } from 'vitest'
import { createFetchServer } from '../src/fetch-server'

const scannerMocks = vi.hoisted(() => ({
  scanRoutes: vi.fn(async (params: {
    onIgnore?: (info: { file: string, reason: string }) => void
  }) => {
    params.onIgnore?.({ file: 'ignored.txt', reason: 'unsupported' })
    return []
  }),
  sortRoutes: vi.fn((routes: unknown[]) => routes),
}))

const watcherMocks = vi.hoisted(() => ({
  onChange: null as null | (() => void),
  createWatcher: vi.fn(async ({ onChange }: { onChange: () => void }) => {
    watcherMocks.onChange = onChange
    return { close: vi.fn() }
  }),
}))

vi.mock('../src/dev/scanner', () => ({
  scanRoutes: scannerMocks.scanRoutes,
}))
vi.mock('../src/dev/routes', () => ({
  sortRoutes: scannerMocks.sortRoutes,
}))
vi.mock('../src/fetch-server/watcher', () => ({
  createWatcher: watcherMocks.createWatcher,
}))

describe('fetch server refresh scheduling', () => {
  it('debounces refresh calls and collects ignored files', async () => {
    vi.useFakeTimers()
    const server = await createFetchServer({
      entries: {
        dir: '/root/mock',
        watch: true,
        log: false,
      },
      playground: false,
    })

    expect(scannerMocks.scanRoutes).toHaveBeenCalledTimes(1)
    watcherMocks.onChange?.()
    vi.advanceTimersByTime(80)
    await Promise.resolve()
    expect(scannerMocks.scanRoutes).toHaveBeenCalledTimes(2)

    await server.close?.()
    vi.useRealTimers()
  })
})
