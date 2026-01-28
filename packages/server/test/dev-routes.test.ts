import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { deriveRouteFromFile, resolveRule, sortRoutes } from '../src/dev/routes'

describe('dev routes helpers', () => {
  it('derives routes and warns on invalid segments', () => {
    const logger = { warn: vi.fn() }
    const rootDir = '/tmp/mokup-root'

    const derived = deriveRouteFromFile(
      path.join(rootDir, 'users.post.ts'),
      rootDir,
      logger,
    )
    expect(derived?.method).toBe('POST')
    expect(derived?.template).toBe('/users')

    const grouped = deriveRouteFromFile(
      path.join(rootDir, '(group)', 'users.get.json'),
      rootDir,
      logger,
    )
    expect(grouped).toBeNull()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('resolves rules, handles missing methods, and sorts routes', () => {
    const logger = { warn: vi.fn() }
    const resolved = resolveRule({
      rule: { handler: { ok: true }, status: 201 },
      derivedTemplate: '/users/[id]',
      derivedMethod: 'GET',
      prefix: '/api',
      file: '/tmp/mock/users.get.json',
      logger,
    })
    expect(resolved?.template).toBe('/api/users/[id]')
    expect(resolved?.status).toBe(201)

    const normalized = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: 'users',
      derivedMethod: 'GET',
      prefix: '/',
      file: '/tmp/mock/users.get.json',
      logger,
    })
    expect(normalized?.template).toBe('/users')

    const alreadyPrefixed = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/api/ping',
      derivedMethod: 'GET',
      prefix: '/api',
      file: '/tmp/mock/ping.get.json',
      logger,
    })
    expect(alreadyPrefixed?.template).toBe('/api/ping')

    expect(resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/users',
      derivedMethod: undefined,
      prefix: '',
      file: '/tmp/mock/users.json',
      logger,
    })).toBeNull()
    expect(logger.warn).toHaveBeenCalled()

    const invalid = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/users',
      derivedMethod: 'GET',
      prefix: '/(group)',
      file: '/tmp/mock/users.json',
      logger,
    })
    expect(invalid).toBeNull()

    const routes = sortRoutes([
      { template: '/users/[id]', method: 'GET', score: [2, 3], file: 'a', handler: {} },
      { template: '/users', method: 'GET', score: [4], file: 'b', handler: {} },
      { template: '/users', method: 'POST', score: [3], file: 'c', handler: {} },
    ])
    expect(routes.map(route => `${route.method}:${route.template}`)).toEqual([
      'GET:/users',
      'GET:/users/[id]',
      'POST:/users',
    ])
  })
})
