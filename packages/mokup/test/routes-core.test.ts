import { deriveRouteFromFile, resolveRule, sortRoutes } from '@mokup/core'
import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it, vi } from 'vitest'

function createLogger() {
  return { warn: vi.fn() }
}

describe('route derivation', () => {
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
    const missingMethod = deriveRouteFromFile('/root/mock/ping.ts', '/root/mock', logger)
    expect(missingMethod).toBeNull()

    const emptyName = deriveRouteFromFile('/root/mock/.get.ts', '/root/mock', logger)
    expect(emptyName).toBeNull()

    const invalid = deriveRouteFromFile('/root/mock/[id.get.ts', '/root/mock', logger)
    expect(invalid).toBeNull()

    expect(logger.warn).toHaveBeenCalled()
  })
})

describe('route resolution and sorting', () => {
  it('resolves rules with prefix overrides', () => {
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
  })

  it('returns null when derived method is missing', () => {
    const logger = createLogger()
    const rule = resolveRule({
      rule: { handler: () => ({ ok: true }) },
      derivedTemplate: '/ping',
      derivedMethod: undefined,
      prefix: '',
      file: '/root/mock/ping.ts',
      logger,
    })

    expect(rule).toBeNull()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('sorts routes by method and score', () => {
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

    expect(routes[0]?.method).toBe('GET')
    expect(routes[0]?.template).toBe('/users/profile')
    expect(routes[1]?.method).toBe('GET')
    expect(routes[2]?.method).toBe('POST')
  })

  it('normalizes templates for prefix edge cases', () => {
    const logger = createLogger()
    const baseRule = { handler: { ok: true } }

    const noPrefix = resolveRule({
      rule: baseRule,
      derivedTemplate: 'users',
      derivedMethod: 'GET',
      prefix: '',
      file: '/root/mock/users.get.ts',
      logger,
    })
    expect(noPrefix?.template).toBe('/users')

    const rootPrefix = resolveRule({
      rule: baseRule,
      derivedTemplate: '/users',
      derivedMethod: 'GET',
      prefix: '/',
      file: '/root/mock/users.get.ts',
      logger,
    })
    expect(rootPrefix?.template).toBe('/users')

    const alreadyPrefixed = resolveRule({
      rule: baseRule,
      derivedTemplate: '/api/users',
      derivedMethod: 'GET',
      prefix: '/api',
      file: '/root/mock/users.get.ts',
      logger,
    })
    expect(alreadyPrefixed?.template).toBe('/api/users')

    const rootTemplate = resolveRule({
      rule: baseRule,
      derivedTemplate: '/',
      derivedMethod: 'GET',
      prefix: '/api',
      file: '/root/mock/index.get.ts',
      logger,
    })
    expect(rootTemplate?.template).toBe('/api')
  })
})
