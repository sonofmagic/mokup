import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Logger, ResolvedRoute, RouteTable } from '../src/vite/types'
import { Buffer } from 'node:buffer'
import path from 'node:path'
import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it } from 'vitest'
import { createPlaygroundMiddleware, resolvePlaygroundOptions } from '../src/vite/playground'

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
    response: {},
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
      config: resolvePlaygroundOptions(true),
      logger,
      getDirs: () => [mockDir, extraDir],
      getServer: () => ({ config: { root } }) as never,
    })

    const { res, state } = createResponse()
    let nextCalled = false
    await middleware(
      { url: '/_mokup/routes' } as IncomingMessage,
      res,
      () => {
        nextCalled = true
      },
    )

    const payload = JSON.parse(state.body) as {
      groups: { key: string, label: string }[]
      routes: { group?: string, groupKey?: string, file: string, url: string }[]
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
  })
})
