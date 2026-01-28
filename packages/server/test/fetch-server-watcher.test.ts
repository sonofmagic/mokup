import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWatcher } from '../src/fetch-server/watcher'

const chokidarHandlers: Record<string, Array<(file: string, details?: unknown) => void>> = {
  add: [],
  change: [],
  unlink: [],
  raw: [],
}

const chokidarClose = vi.fn()
const chokidarWatch = vi.fn().mockReturnValue({
  on: (event: string, handler: (file: string, details?: unknown) => void) => {
    if (event in chokidarHandlers) {
      chokidarHandlers[event].push(handler)
    }
    return this
  },
  close: chokidarClose,
})

vi.mock('@mokup/shared/chokidar', () => ({
  default: { watch: chokidarWatch },
}))

function resetChokidarHandlers() {
  for (const key of Object.keys(chokidarHandlers)) {
    chokidarHandlers[key] = []
  }
  chokidarClose.mockReset()
  chokidarWatch.mockClear()
}

describe('fetch-server watcher', () => {
  const logger = { warn: vi.fn() }

  beforeEach(() => {
    resetChokidarHandlers()
    delete (globalThis as { Deno?: unknown }).Deno
  })

  afterEach(() => {
    delete (globalThis as { Deno?: unknown }).Deno
  })

  it('returns null when disabled or empty', async () => {
    const watcher = await createWatcher({
      enabled: false,
      dirs: [],
      onChange: vi.fn(),
      logger,
    })

    expect(watcher).toBeNull()
  })

  it('uses Deno watcher when available', async () => {
    const onChange = vi.fn()
    const iterator = async function* () {
      yield { kind: 'access', paths: [] }
      yield { kind: 'modify', paths: [] }
    }
    ;(globalThis as { Deno?: unknown }).Deno = {
      watchFs: () => ({
        close: vi.fn(),
        [Symbol.asyncIterator]: iterator,
      }),
    }

    const watcher = await createWatcher({
      enabled: true,
      dirs: ['/tmp/mock'],
      onChange,
      logger,
    })

    expect(watcher).not.toBeNull()
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(onChange).toHaveBeenCalledTimes(1)
    await watcher?.close()
  })

  it('falls back to chokidar watcher', async () => {
    const onChange = vi.fn()
    const dirs = ['/tmp/mock']
    const watcher = await createWatcher({
      enabled: true,
      dirs,
      onChange,
      logger,
    })

    expect(watcher).not.toBeNull()
    expect(chokidarWatch).toHaveBeenCalledWith(dirs, { ignoreInitial: true })

    chokidarHandlers.add.forEach(handler => handler('/tmp/mock/users.get.json'))
    chokidarHandlers.change.forEach(handler => handler('/tmp/mock/users.get.json'))
    chokidarHandlers.unlink.forEach(handler => handler('/tmp/mock/users.get.json'))

    expect(onChange).toHaveBeenCalledTimes(3)

    const before = onChange.mock.calls.length
    chokidarHandlers.add.forEach(handler => handler('/tmp/other/skip.get.json'))
    chokidarHandlers.change.forEach(handler => handler('/tmp/other/skip.get.json'))
    chokidarHandlers.unlink.forEach(handler => handler('/tmp/other/skip.get.json'))
    expect(onChange).toHaveBeenCalledTimes(before)
    await watcher?.close()
    expect(chokidarClose).toHaveBeenCalled()
  })

  it('logs when chokidar cannot initialize', async () => {
    chokidarWatch.mockImplementationOnce(() => {
      throw new Error('boom')
    })

    const warn = vi.fn()
    const watcher = await createWatcher({
      enabled: true,
      dirs: ['/tmp/mock'],
      onChange: vi.fn(),
      logger: { warn },
    })

    expect(watcher).toBeNull()
    expect(warn).toHaveBeenCalled()
  })

  it('logs deno watcher errors', async () => {
    const warn = vi.fn()
    const iterator = async function* () {
      throw new Error('boom')
    }
    ;(globalThis as { Deno?: unknown }).Deno = {
      watchFs: () => ({
        close: vi.fn(),
        [Symbol.asyncIterator]: iterator,
      }),
    }

    const watcher = await createWatcher({
      enabled: true,
      dirs: ['/tmp/mock'],
      onChange: vi.fn(),
      logger: { warn },
    })

    await new Promise(resolve => setTimeout(resolve, 10))
    expect(warn).toHaveBeenCalled()
    await watcher?.close()
  })

  it('suppresses deno watcher errors after close', async () => {
    const warn = vi.fn()
    const iterator = async function* () {
      await new Promise(resolve => setTimeout(resolve, 5))
      throw new Error('boom')
    }
    ;(globalThis as { Deno?: unknown }).Deno = {
      watchFs: () => ({
        close: vi.fn(),
        [Symbol.asyncIterator]: iterator,
      }),
    }

    const watcher = await createWatcher({
      enabled: true,
      dirs: ['/tmp/mock'],
      onChange: vi.fn(),
      logger: { warn },
    })

    await watcher?.close()
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(warn).not.toHaveBeenCalled()
  })
})
