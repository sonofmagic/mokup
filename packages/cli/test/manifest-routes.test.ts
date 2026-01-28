import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { deriveRouteFromFile, resolveRule, sortRoutes } from '../src/manifest/routes'

describe('manifest route helpers', () => {
  it('derives templates, methods, and logs invalid routes', () => {
    const logs: string[] = []
    const log = (message: string) => logs.push(message)
    const rootDir = '/tmp/mokup-root'

    const jsonDerived = deriveRouteFromFile(
      path.join(rootDir, 'status.json'),
      rootDir,
      log,
    )
    expect(jsonDerived?.method).toBe('GET')

    const missingMethod = deriveRouteFromFile(
      path.join(rootDir, 'users.ts'),
      rootDir,
      log,
    )
    expect(missingMethod).toBeNull()

    const derived = deriveRouteFromFile(
      path.join(rootDir, 'users.post.ts'),
      rootDir,
      log,
    )
    expect(derived?.method).toBe('POST')
    expect(derived?.template).toBe('/users')

    const indexRoute = deriveRouteFromFile(
      path.join(rootDir, 'index.get.json'),
      rootDir,
      log,
    )
    expect(indexRoute?.template).toBe('/')

    const emptyName = deriveRouteFromFile(
      path.join(rootDir, '.get.json'),
      rootDir,
      log,
    )
    expect(emptyName).toBeNull()

    const grouped = deriveRouteFromFile(
      path.join(rootDir, '(group)', 'users.get.json'),
      rootDir,
      log,
    )
    expect(grouped).toBeNull()
    expect(logs.some(message => message.includes('Route groups'))).toBe(true)

    logs.length = 0
    const warned = deriveRouteFromFile(
      path.join(rootDir, 'users', '[id]', '[id].get.json'),
      rootDir,
      log,
    )
    expect(warned).not.toBeNull()
    expect(logs.some(message => message.includes('Duplicate param name'))).toBe(true)
  })

  it('resolves rules with prefix and sorts by method/score', () => {
    const resolved = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/users/[id]',
      derivedMethod: 'GET',
      prefix: '/api',
      file: '/tmp/mock/users.get.json',
    })
    expect(resolved?.template).toBe('/api/users/[id]')

    const rootResolved = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/',
      derivedMethod: 'GET',
      prefix: 'api/',
      file: '/tmp/mock/root.get.json',
    })
    expect(rootResolved?.template).toBe('/api')

    const alreadyPrefixed = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/api/ping',
      derivedMethod: 'GET',
      prefix: '/api',
      file: '/tmp/mock/ping.get.json',
    })
    expect(alreadyPrefixed?.template).toBe('/api/ping')

    const normalizedPrefix = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: 'users',
      derivedMethod: 'GET',
      prefix: '/',
      file: '/tmp/mock/users.get.json',
    })
    expect(normalizedPrefix?.template).toBe('/users')

    expect(resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/users',
      prefix: '',
      file: '/tmp/mock/users.json',
    })).toBeNull()

    const routes = sortRoutes([
      { method: 'POST', url: '/users', score: [3], response: { type: 'text', body: '' } },
      { method: 'GET', url: '/users/[id]', score: [2, 3], response: { type: 'text', body: '' } },
      { method: 'GET', url: '/users', score: [4], response: { type: 'text', body: '' } },
    ])
    expect(routes.map(route => route.url)).toEqual([
      '/users',
      '/users/[id]',
      '/users',
    ])

    const scoreFallback = sortRoutes([
      { method: 'GET', url: '/a', response: { type: 'text', body: '' } },
      { method: 'GET', url: '/b', score: [1], response: { type: 'text', body: '' } },
    ])
    expect(scoreFallback.map(route => route.url)).toEqual(['/b', '/a'])
  })

  it('logs resolve errors and warnings', () => {
    const logs: string[] = []
    const log = (message: string) => logs.push(message)

    const invalid = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/(group)/users',
      derivedMethod: 'GET',
      prefix: '',
      file: '/tmp/mock/users.get.json',
      log,
    })
    expect(invalid).toBeNull()
    expect(logs.some(message => message.includes('Route groups'))).toBe(true)

    logs.length = 0
    const warned = resolveRule({
      rule: { handler: { ok: true } },
      derivedTemplate: '/users/[id]/[id]',
      derivedMethod: 'GET',
      prefix: '',
      file: '/tmp/mock/users.get.json',
      log,
    })
    expect(warned).not.toBeNull()
    expect(logs.some(message => message.includes('Duplicate param name'))).toBe(true)
  })
})
