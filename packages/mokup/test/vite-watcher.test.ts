import { describe, expect, it, vi } from 'vitest'
import { setupPreviewWatchers, setupViteWatchers } from '../src/vite/plugin/watcher'

const previewMocks = vi.hoisted(() => {
  const handlers: Record<string, Array<(event: string, rawPath?: unknown, details?: unknown) => void>> = {
    add: [],
    change: [],
    unlink: [],
    raw: [],
  }
  const close = vi.fn()
  const watch = vi.fn().mockReturnValue({
    on: (event: string, handler: (eventName: string, rawPath?: unknown, details?: unknown) => void) => {
      if (event in handlers) {
        handlers[event].push(handler)
      }
      return this
    },
    close,
  })
  return { handlers, close, watch }
})

vi.mock('@mokup/shared/chokidar', () => ({
  default: { watch: previewMocks.watch },
}))

describe('vite plugin watchers', () => {
  it('refreshes on vite watcher events', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const handlers: Record<string, Array<(file: string, details?: unknown) => void>> = {
      add: [],
      change: [],
      unlink: [],
      raw: [],
    }
    const server = {
      config: { root: '/root' },
      watcher: {
        add: vi.fn(),
        on: (event: string, handler: (file: string, details?: unknown) => void) => {
          if (event in handlers) {
            handlers[event].push(handler)
          }
        },
      },
    }

    setupViteWatchers({
      server: server as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    handlers.add.forEach(handler => handler('/root/mock/users.get.json'))
    handlers.raw.forEach(handler => handler('rename', 'mock/users.get.json', { watchedPath: '/root' }))

    vi.advanceTimersByTime(80)
    expect(refresh).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('closes preview watcher on server close', () => {
    const closeListeners: Array<() => void> = []
    const server = {
      config: { root: '/root' },
      httpServer: {
        once: (_event: string, handler: () => void) => {
          closeListeners.push(handler)
        },
      },
    }

    const watcher = setupPreviewWatchers({
      server: server as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh: vi.fn(),
    })

    expect(watcher).not.toBeNull()
    closeListeners.forEach(handler => handler())
    expect(previewMocks.close).toHaveBeenCalled()
  })

  it('ignores raw watcher events outside target dirs', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const handlers: Record<string, Array<(eventName: string, rawPath?: unknown, details?: unknown) => void>> = {
      add: [],
      change: [],
      unlink: [],
      raw: [],
    }
    const server = {
      config: { root: '/root' },
      watcher: {
        add: vi.fn(),
        on: (event: string, handler: (eventName: string, rawPath?: unknown, details?: unknown) => void) => {
          if (event in handlers) {
            handlers[event].push(handler)
          }
        },
      },
    }

    setupViteWatchers({
      server: server as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    handlers.raw.forEach(handler => handler('change', 'mock/users.get.json'))
    handlers.raw.forEach(handler => handler('rename', { toString: () => '' }))
    handlers.raw.forEach(handler => handler('rename', { toString: () => 'other/file.json' }, { watchedPath: '/root' }))

    vi.advanceTimersByTime(80)
    expect(refresh).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('refreshes preview watcher on raw rename events', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const server = {
      config: { root: '/root' },
      httpServer: {
        once: vi.fn(),
      },
    }

    setupPreviewWatchers({
      server: server as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    previewMocks.handlers.raw.forEach(handler => handler('rename', 'mock/users.get.json'))
    vi.advanceTimersByTime(80)
    expect(refresh).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('handles empty files and fallback roots', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const handlers: Record<string, Array<(file: string, details?: unknown) => void>> = {
      add: [],
      change: [],
      unlink: [],
      raw: [],
    }
    const server = {
      config: {},
      watcher: {
        add: vi.fn(),
        on: (event: string, handler: (file: string, details?: unknown) => void) => {
          if (event in handlers) {
            handlers[event].push(handler)
          }
        },
      },
    }

    setupViteWatchers({
      server: server as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    handlers.add.forEach(handler => handler(''))
    handlers.raw.forEach(handler => handler('rename', { toString: () => 'mock/users.get.json' }))
    handlers.raw.forEach(handler => handler('rename', null))

    vi.advanceTimersByTime(80)
    expect(refresh).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('handles preview raw watcher variations', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const server = {
      config: {},
      httpServer: {
        once: vi.fn(),
      },
    }

    setupPreviewWatchers({
      server: server as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    previewMocks.handlers.raw.forEach(handler => handler('change', 'mock/skip.json'))
    previewMocks.handlers.raw.forEach(handler => handler('rename', { toString: () => '' }))
    previewMocks.handlers.raw.forEach(handler => handler(
      'rename',
      { toString: () => 'mock/users.get.json' },
      { watchedPath: '/root' },
    ))
    previewMocks.handlers.add.forEach(handler => handler('/root/mock/users.get.json'))

    vi.advanceTimersByTime(80)
    expect(refresh).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('handles raw rename details and ignores preview files outside dirs', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const handlers: Record<string, Array<(eventName: string, rawPath?: unknown, details?: unknown) => void>> = {
      add: [],
      change: [],
      unlink: [],
      raw: [],
    }
    const server = {
      config: { root: '/root' },
      watcher: {
        add: vi.fn(),
        on: (event: string, handler: (eventName: string, rawPath?: unknown, details?: unknown) => void) => {
          if (event in handlers) {
            handlers[event].push(handler)
          }
        },
      },
    }

    setupViteWatchers({
      server: server as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    handlers.raw.forEach(handler => handler('rename', 'mock/users.get.json', { watchedPath: undefined }))
    vi.advanceTimersByTime(80)
    expect(refresh).toHaveBeenCalled()

    const previewServer = {
      config: { root: '/root' },
      httpServer: { once: vi.fn() },
    }

    setupPreviewWatchers({
      server: previewServer as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    previewMocks.handlers.add.forEach(handler => handler('/root/other/users.get.json'))
    vi.advanceTimersByTime(80)
    expect(refresh).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('falls back to params.root when watcher roots are missing', () => {
    vi.useFakeTimers()
    const refresh = vi.fn()
    const handlers: Record<string, Array<(eventName: string, rawPath?: unknown, details?: unknown) => void>> = {
      add: [],
      change: [],
      unlink: [],
      raw: [],
    }
    const server = {
      config: {},
      watcher: {
        add: vi.fn(),
        on: (event: string, handler: (eventName: string, rawPath?: unknown, details?: unknown) => void) => {
          if (event in handlers) {
            handlers[event].push(handler)
          }
        },
      },
    }

    setupViteWatchers({
      server: server as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    handlers.raw.forEach(handler => handler('rename', 'mock/users.get.json', { watchedPath: undefined }))
    vi.advanceTimersByTime(80)
    expect(refresh).toHaveBeenCalled()

    const previewServer = {
      config: {},
      httpServer: { once: vi.fn() },
    }
    setupPreviewWatchers({
      server: previewServer as any,
      root: '/root',
      dirs: ['/root/mock'],
      refresh,
    })

    previewMocks.handlers.raw.forEach(handler =>
      handler('rename', 'mock/users.get.json', { watchedPath: undefined }),
    )
    vi.advanceTimersByTime(80)
    expect(refresh).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})
