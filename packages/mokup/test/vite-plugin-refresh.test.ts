import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it, vi } from 'vitest'
import { createRouteRefresher } from '../src/vite/plugin/refresh'

const mocks = vi.hoisted(() => ({
  scanRoutes: vi.fn(),
}))

vi.mock('../src/core/scanner', () => ({
  scanRoutes: mocks.scanRoutes,
}))

describe('vite plugin route refresh', () => {
  it('refreshes routes and notifies the dev server', async () => {
    const parsed = parseRouteTemplate('/ping')
    let callIndex = 0
    mocks.scanRoutes.mockImplementation(async (params: any) => {
      params.onSkip?.({ reason: 'disabled', file: '/root/mock/skip.get.ts' })
      params.onIgnore?.({ reason: 'ignored', file: '/root/mock/ignore.txt' })
      params.onConfig?.({ file: '/root/mock/index.config.ts', enabled: callIndex === 0 })
      callIndex += 1
      return [
        {
          file: '/root/mock/ping.get.ts',
          template: parsed.template,
          method: 'GET',
          tokens: parsed.tokens,
          score: parsed.score,
          handler: { ok: true },
        },
      ]
    })

    const state = {
      routes: [],
      serverRoutes: [],
      swRoutes: [],
      disabledRoutes: [],
      ignoredRoutes: [],
      configFiles: [],
      disabledConfigFiles: [],
      app: null,
      lastSignature: 'old',
    }

    const refresher = createRouteRefresher({
      state: state as never,
      optionList: [
        {
          dir: '/root/mock',
          prefix: '/api',
          mode: 'sw',
          sw: { fallback: false },
          include: [/^ping/],
          exclude: [/skip/],
          ignorePrefix: ['_'],
        },
        {
          dir: '/root/server',
          prefix: '/srv',
          mode: 'server',
        },
      ],
      root: () => '/root',
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      enableViteMiddleware: true,
    })

    const server = { ws: { send: vi.fn() } }
    await refresher(server as never)

    expect(state.routes).toHaveLength(2)
    expect(state.swRoutes).toHaveLength(1)
    expect(state.serverRoutes).toHaveLength(1)
    expect(state.disabledRoutes).toHaveLength(2)
    expect(state.ignoredRoutes).toHaveLength(2)
    expect(state.configFiles).toHaveLength(0)
    expect(state.disabledConfigFiles).toHaveLength(1)
    expect(state.app).not.toBeNull()
    expect(server.ws.send).toHaveBeenCalled()

    const firstCall = mocks.scanRoutes.mock.calls[0]?.[0]
    expect(firstCall.include).toEqual([/^ping/])
    expect(firstCall.exclude).toEqual([/skip/])
    expect(firstCall.ignorePrefix).toEqual(['_'])
  })
})
