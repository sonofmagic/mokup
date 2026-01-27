import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it, vi } from 'vitest'
import { deriveRouteFromFile, resolveRule, sortRoutes } from '../src/dev/routes'

describe('dev routes helpers', () => {
  it('derives route metadata from files', () => {
    const logger = { warn: vi.fn() }
    const derived = deriveRouteFromFile('/root/mock/index.get.ts', '/root/mock', logger)
    expect(derived?.template).toBe('/')
    expect(derived?.method).toBe('GET')

    const jsonDerived = deriveRouteFromFile('/root/mock/status.json', '/root/mock', logger)
    expect(jsonDerived?.method).toBe('GET')

    const invalid = deriveRouteFromFile('/root/mock/.get.ts', '/root/mock', logger)
    expect(invalid).toBeNull()
    expect(logger.warn).toHaveBeenCalled()

    const missingMethod = deriveRouteFromFile('/root/mock/users.ts', '/root/mock', logger)
    expect(missingMethod).toBeNull()
  })

  it('resolves rules and sorts by score', () => {
    const logger = { warn: vi.fn() }
    const parsed = parseRouteTemplate('/users')
    const route = resolveRule({
      rule: { handler: () => ({ ok: true }), status: 201, headers: { 'x-test': '1' }, delay: 10 },
      derivedTemplate: parsed.template,
      derivedMethod: 'GET',
      prefix: '/api',
      file: '/root/mock/users.get.ts',
      logger,
    })

    expect(route?.template).toBe('/api/users')
    expect(route?.status).toBe(201)

    const rootRoute = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/',
      derivedMethod: 'GET',
      prefix: '/api/',
      file: '/root/mock/index.get.ts',
      logger,
    })
    expect(rootRoute?.template).toBe('/api')

    const warned = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/users/[id]/[id]',
      derivedMethod: 'GET',
      prefix: '',
      file: '/root/mock/users.get.ts',
      logger,
    })
    expect(warned).not.toBeNull()

    const fast = parseRouteTemplate('/users/profile')
    const slow = parseRouteTemplate('/users/[id]')
    const routes = sortRoutes([
      {
        file: 'b.get.ts',
        template: slow.template,
        method: 'GET',
        tokens: slow.tokens,
        score: slow.score,
        handler: { ok: true },
      },
      {
        file: 'a.get.ts',
        template: fast.template,
        method: 'GET',
        tokens: fast.tokens,
        score: fast.score,
        handler: { ok: true },
      },
    ])

    expect(routes[0]?.template).toBe('/users/profile')
  })
})
