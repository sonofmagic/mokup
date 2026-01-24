import path from 'node:path'
import { parseRouteTemplate } from '@mokup/runtime'
import { describe, expect, it } from 'vitest'
import { deriveRouteFromFile, sortRoutes } from '../src/core/routes'

function createLogger() {
  const warnings: string[] = []
  return {
    warnings,
    logger: {
      warn: (...args: unknown[]) => warnings.push(args.map(String).join(' ')),
    },
  }
}

describe('file route derivation', () => {
  it('derives template and tokens from file path', () => {
    const { logger } = createLogger()
    const root = path.join('/tmp', 'mock')
    const file = path.join(root, 'users', '[id].get.ts')
    const derived = deriveRouteFromFile(file, root, logger)

    expect(derived?.template).toBe('/users/[id]')
    expect(derived?.method).toBe('GET')
    expect(derived?.tokens).toEqual([
      { type: 'static', value: 'users' },
      { type: 'param', name: 'id' },
    ])
  })

  it('maps index to parent path', () => {
    const { logger } = createLogger()
    const root = path.join('/tmp', 'mock')
    const file = path.join(root, 'users', 'index.get.json')
    const derived = deriveRouteFromFile(file, root, logger)

    expect(derived?.template).toBe('/users')
  })

  it('warns and skips files without method suffix', () => {
    const { warnings, logger } = createLogger()
    const root = path.join('/tmp', 'mock')
    const file = path.join(root, 'profile.ts')
    const derived = deriveRouteFromFile(file, root, logger)

    expect(derived).toBeNull()
    expect(warnings.some(message => message.includes('method suffix'))).toBe(true)
  })

  it('defaults json files without method suffix to GET', () => {
    const { warnings, logger } = createLogger()
    const root = path.join('/tmp', 'mock')
    const file = path.join(root, 'profile.json')
    const derived = deriveRouteFromFile(file, root, logger)

    expect(derived?.method).toBe('GET')
    expect(warnings.length).toBe(0)
  })

  it('skips unsupported route group segments', () => {
    const { warnings, logger } = createLogger()
    const root = path.join('/tmp', 'mock')
    const file = path.join(root, '(group)', 'users.get.json')
    const derived = deriveRouteFromFile(file, root, logger)

    expect(derived).toBeNull()
    expect(warnings.some(message => message.includes('Route groups'))).toBe(true)
  })
})

describe('route sorting', () => {
  it('orders static routes before dynamic and catch-all', () => {
    const staticRoute = parseRouteTemplate('/users/me')
    const dynamicRoute = parseRouteTemplate('/users/[id]')
    const catchallRoute = parseRouteTemplate('/users/[...slug]')

    const routes = sortRoutes([
      {
        file: 'b',
        template: '/users/[id]',
        method: 'GET',
        tokens: dynamicRoute.tokens,
        score: dynamicRoute.score,
        handler: {},
      },
      {
        file: 'c',
        template: '/users/[...slug]',
        method: 'GET',
        tokens: catchallRoute.tokens,
        score: catchallRoute.score,
        handler: {},
      },
      {
        file: 'a',
        template: '/users/me',
        method: 'GET',
        tokens: staticRoute.tokens,
        score: staticRoute.score,
        handler: {},
      },
    ])

    expect(routes.map(route => route.template)).toEqual([
      '/users/me',
      '/users/[id]',
      '/users/[...slug]',
    ])
  })
})
