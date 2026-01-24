import type { IncomingMessage, ServerResponse } from 'node:http'
import type { ViteDevServer } from 'vite'
import type { Logger, ResolvedRoute, RouteTable } from '../src/shared/types'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it, vi } from 'vitest'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from '../src/core/playground'

function toPosixPath(value: string) {
  return value.replace(/\\/g, '/')
}

function normalizePath(value: string) {
  return toPosixPath(path.normalize(value))
}

function createRoute(params: {
  file: string
  template: string
  method: ResolvedRoute['method']
}): ResolvedRoute {
  const parsed = parseRouteTemplate(params.template)
  return {
    file: params.file,
    template: parsed.template,
    method: params.method,
    tokens: parsed.tokens,
    score: parsed.score,
    handler: {},
  }
}

function createResponse() {
  const state = {
    body: '',
    statusCode: 0,
    headers: {} as Record<string, string>,
  }
  const res = {
    setHeader: (name: string, value: string) => {
      state.headers[name] = value
    },
    getHeader: (name: string) => state.headers[name],
    end: (chunk?: string | Uint8Array) => {
      if (typeof chunk === 'undefined') {
        state.body = ''
        return
      }
      state.body = typeof chunk === 'string'
        ? chunk
        : Buffer.from(chunk).toString('utf8')
    },
    get statusCode() {
      return state.statusCode
    },
    set statusCode(value: number) {
      state.statusCode = value
    },
  } as unknown as ServerResponse

  return { res, state }
}

describe('playground routes endpoint', () => {
  it('returns grouped routes relative to root', async () => {
    const root = path.join('/repo', 'apps', 'web')
    const mockDir = path.join(root, 'mock')
    const extraDir = path.join(root, 'mock-extra')
    const logger: Logger = {
      info: () => {},
      warn: () => {},
      error: () => {},
    }

    const routes: RouteTable = [
      createRoute({
        file: path.join(mockDir, 'health.get.ts'),
        template: '/health',
        method: 'GET',
      }),
      createRoute({
        file: path.join(extraDir, 'messages.post.ts'),
        template: '/messages',
        method: 'POST',
      }),
    ]

    const middleware = createPlaygroundMiddleware({
      getRoutes: () => routes,
      getDisabledRoutes: () => [
        {
          file: path.join(mockDir, '.draft', 'hidden.get.ts'),
          reason: 'ignore-prefix',
          method: 'GET',
          url: '/hidden',
          decisionChain: [
            {
              step: 'config.enabled',
              result: 'pass',
              source: path.join(mockDir, 'index.config.ts'),
              detail: 'enabled=true',
            },
            {
              step: 'ignore-prefix',
              result: 'fail',
              detail: 'prefixes: .',
            },
          ],
          effectiveConfig: {
            ignorePrefix: ['.'],
          },
        },
      ],
      getIgnoredRoutes: () => [
        {
          file: path.join(mockDir, 'assets', 'logo.png'),
          reason: 'unsupported',
          decisionChain: [
            {
              step: 'file.supported',
              result: 'fail',
              detail: 'unsupported file type',
            },
          ],
          effectiveConfig: {
            include: '/\\.ts$/',
          },
        },
      ],
      getConfigFiles: () => [
        {
          file: path.join(mockDir, 'index.config.ts'),
        },
      ],
      getDisabledConfigFiles: () => [
        {
          file: path.join(mockDir, 'disabled-dir', 'index.config.ts'),
        },
      ],
      config: resolvePlaygroundOptions(true),
      logger,
      getDirs: () => [mockDir, extraDir],
      getServer: () => ({ config: { root } }) as never,
    })

    const { res, state } = createResponse()
    let nextCalled = false
    await middleware(
      { url: '/__mokup/routes' } as IncomingMessage,
      res,
      () => {
        nextCalled = true
      },
    )

    const payload = JSON.parse(state.body) as {
      groups: { key: string, label: string }[]
      routes: { group?: string, groupKey?: string, file: string, url: string }[]
      disabled: {
        group?: string
        groupKey?: string
        file: string
        url?: string
        reason: string
        decisionChain?: { step: string, result: string, source?: string, detail?: string }[]
        effectiveConfig?: { ignorePrefix?: string[] }
      }[]
      ignored: {
        group?: string
        groupKey?: string
        file: string
        reason: string
        decisionChain?: { step: string, result: string, source?: string, detail?: string }[]
        effectiveConfig?: { include?: string }
      }[]
      configs: { group?: string, groupKey?: string, file: string }[]
      disabledConfigs: { group?: string, groupKey?: string, file: string }[]
    }
    const expectedGroups = [
      { key: normalizePath(mockDir), label: 'mock' },
      { key: normalizePath(extraDir), label: 'mock-extra' },
    ]

    expect(nextCalled).toBe(false)
    expect(payload.groups).toEqual(expectedGroups)

    const healthRoute = payload.routes.find(route => route.url === '/health')
    expect(healthRoute).toMatchObject({
      group: 'mock',
      groupKey: expectedGroups[0].key,
      file: 'mock/health.get.ts',
    })

    const messagesRoute = payload.routes.find(route => route.url === '/messages')
    expect(messagesRoute).toMatchObject({
      group: 'mock-extra',
      groupKey: expectedGroups[1].key,
      file: 'mock-extra/messages.post.ts',
    })

    const disabledRoute = payload.disabled.find(route => route.url === '/hidden')
    expect(disabledRoute).toMatchObject({
      group: 'mock',
      groupKey: expectedGroups[0].key,
      file: 'mock/.draft/hidden.get.ts',
      reason: 'ignore-prefix',
    })
    expect(disabledRoute?.decisionChain?.[0]).toMatchObject({
      step: 'config.enabled',
      result: 'pass',
      source: 'mock/index.config.ts',
    })
    expect(disabledRoute?.effectiveConfig).toMatchObject({
      ignorePrefix: ['.'],
    })

    const ignoredRoute = payload.ignored.find(route => route.file === 'mock/assets/logo.png')
    expect(ignoredRoute).toMatchObject({
      group: 'mock',
      groupKey: expectedGroups[0].key,
      file: 'mock/assets/logo.png',
      reason: 'unsupported',
    })
    expect(ignoredRoute?.decisionChain?.[0]).toMatchObject({
      step: 'file.supported',
      result: 'fail',
    })
    expect(ignoredRoute?.effectiveConfig).toMatchObject({
      include: '/\\.ts$/',
    })

    const configFile = payload.configs.find(entry => entry.file === 'mock/index.config.ts')
    expect(configFile).toMatchObject({
      group: 'mock',
      groupKey: expectedGroups[0].key,
      file: 'mock/index.config.ts',
    })

    const disabledConfigFile = payload.disabledConfigs.find(entry => entry.file === 'mock/disabled-dir/index.config.ts')
    expect(disabledConfigFile).toMatchObject({
      group: 'mock',
      groupKey: expectedGroups[0].key,
      file: 'mock/disabled-dir/index.config.ts',
    })
  })
})

describe('playground middleware responses', () => {
  it('redirects base path to trailing slash', async () => {
    const logger: Logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const middleware = createPlaygroundMiddleware({
      getRoutes: () => [],
      config: resolvePlaygroundOptions(true),
      logger,
    })

    const { res, state } = createResponse()
    let nextCalled = false
    await middleware(
      { url: '/__mokup' } as IncomingMessage,
      res,
      () => {
        nextCalled = true
      },
    )

    expect(nextCalled).toBe(false)
    expect(state.statusCode).toBe(302)
    expect(state.headers.Location).toBe('/__mokup/')
  })

  it('serves the playground index and injects HMR/SW scripts', async () => {
    const logger: Logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const middleware = createPlaygroundMiddleware({
      getRoutes: () => [],
      config: resolvePlaygroundOptions({ path: '/__mokup' }),
      logger,
      getServer: () => ({
        ws: {},
        config: { base: '/base/' },
      }) as ViteDevServer,
      getSwScript: () => 'console.log("sw")',
    })

    const { res, state } = createResponse()
    let nextCalled = false
    await middleware(
      { url: '/base/__mokup/' } as IncomingMessage,
      res,
      () => {
        nextCalled = true
      },
    )

    expect(nextCalled).toBe(false)
    expect(state.statusCode).toBe(200)
    expect(state.body).toContain('mokup-playground-hmr')
    expect(state.body).toContain('mokup-playground-sw')
  })

  it('serves static assets from the playground dist', async () => {
    const logger: Logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const middleware = createPlaygroundMiddleware({
      getRoutes: () => [],
      config: resolvePlaygroundOptions(true),
      logger,
    })

    const { res, state } = createResponse()
    let nextCalled = false
    await middleware(
      { url: '/__mokup/assets/index.css' } as IncomingMessage,
      res,
      () => {
        nextCalled = true
      },
    )

    expect(nextCalled).toBe(false)
    expect(state.statusCode).toBe(200)
    expect(state.headers['Content-Type']).toContain('text/css')
    expect(state.body.length).toBeGreaterThan(0)
  })
})
