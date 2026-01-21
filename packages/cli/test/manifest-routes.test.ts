import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { deriveRouteFromFile, resolveRule, sortRoutes } from '../src/manifest/routes'

describe('manifest route helpers', () => {
  it('derives templates, methods, and logs invalid routes', () => {
    const logs: string[] = []
    const log = (message: string) => logs.push(message)
    const rootDir = '/tmp/mokup-root'

    const derived = deriveRouteFromFile(
      path.join(rootDir, 'users.post.ts'),
      rootDir,
      log,
    )
    expect(derived?.method).toBe('POST')
    expect(derived?.template).toBe('/users')

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
  })
})
