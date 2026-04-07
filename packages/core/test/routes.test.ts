import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it, vi } from 'vitest'
import { deriveRouteFromFile, resolveRule, sortRoutes } from '../src/routes'

function createLogger() {
  return { warn: vi.fn() }
}

describe('routes', () => {
  it('derives templates and methods from files', () => {
    const logger = createLogger()
    const derived = deriveRouteFromFile('/root/mock/index.get.ts', '/root/mock', logger)
    expect(derived?.template).toBe('/')
    expect(derived?.method).toBe('GET')

    const jsonDerived = deriveRouteFromFile('/root/mock/status.json', '/root/mock', logger)
    expect(jsonDerived?.method).toBe('GET')
  })

  it('warns and skips invalid files', () => {
    const logger = createLogger()
    expect(deriveRouteFromFile('/root/mock/ping.ts', '/root/mock', logger)).toBeNull()
    expect(deriveRouteFromFile('/root/mock/.get.ts', '/root/mock', logger)).toBeNull()
    expect(deriveRouteFromFile('/root/mock/[id.get.ts', '/root/mock', logger)).toBeNull()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('resolves rules and sorts routes', () => {
    const logger = createLogger()
    const parsed = parseRouteTemplate('/users')
    const rule = resolveRule({
      rule: { handler: () => ({ ok: true }), status: 201, headers: { 'x-test': '1' }, delay: 10 },
      derivedTemplate: parsed.template,
      derivedMethod: 'GET',
      prefix: '/api',
      file: '/root/mock/users.get.ts',
      logger,
    })

    expect(rule?.template).toBe('/api/users')
    expect(rule?.status).toBe(201)
    expect(rule?.headers).toEqual({ 'x-test': '1' })
    expect(rule?.delay).toBe(10)

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
        file: 'a.post.ts',
        template: '/users',
        method: 'POST',
        tokens: [],
        score: [1],
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
    expect(routes[2]?.method).toBe('POST')
  })
})
