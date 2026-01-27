import type { PlaygroundRoute } from '../src/types'
import { describe, expect, it } from 'vitest'
import {
  buildRouteTree,
  buildTreeRows,
  getAllFolderIds,
  sortRouteTree,
} from '../src/utils/tree'

const routes: PlaygroundRoute[] = [
  {
    method: 'GET',
    url: '/',
    file: '/repo/mock/index.get.ts',
    type: 'handler',
  },
  {
    method: 'GET',
    url: '/users',
    file: '/repo/mock/users.get.ts',
    type: 'handler',
  },
  {
    method: 'POST',
    url: '/docs/guide',
    file: '/repo/mock/docs/guide.post.ts',
    type: 'handler',
  },
]

describe('tree utils', () => {
  it('builds folder ids for route trees', () => {
    const ids = getAllFolderIds(routes, 'route')
    expect(ids).toContain('route:folder:docs')
  })

  it('builds rows with selection', () => {
    const root = buildRouteTree(routes, 'route')
    sortRouteTree(root)
    const rows = buildTreeRows({
      root,
      mode: 'route',
      isExpanded: () => true,
      selectedKey: 'GET /users',
      getRouteKey: route => `${route.method} ${route.url}`,
    })

    const selected = rows.find(row => row.selected)
    expect(selected?.route?.url).toBe('/users')
    expect(rows[0]?.kind).toBe('folder')
  })

  it('keeps the root route label as slash', () => {
    const root = buildRouteTree(routes.slice(0, 1), 'route')
    expect(root.children[0]?.label).toBe('/')
  })

  it('builds file-based trees and handles collapsed folders', () => {
    const root = buildRouteTree(routes, 'file')
    sortRouteTree(root)
    const rows = buildTreeRows({
      root,
      mode: 'file',
      isExpanded: () => false,
      selectedKey: 'GET /users',
      getRouteKey: route => `${route.method} ${route.url}`,
    })

    expect(rows.some(row => row.kind === 'folder')).toBe(true)
    expect(rows.every(row => row.depth === 0)).toBe(true)
  })

  it('sorts routes by method when labels match and handles bare urls', () => {
    const extraRoutes: PlaygroundRoute[] = [
      { method: 'POST', url: '/docs', file: '/repo/mock/docs.post.ts', type: 'handler' },
      { method: 'GET', url: '/docs', file: '/repo/mock/docs.get.ts', type: 'handler' },
      { method: 'GET', url: 'status', file: '/repo/mock/status.get.ts', type: 'handler' },
    ]
    const root = buildRouteTree(extraRoutes, 'route')
    sortRouteTree(root)
    const rows = buildTreeRows({
      root,
      mode: 'route',
      isExpanded: () => true,
      selectedKey: 'GET /docs',
      getRouteKey: route => `${route.method} ${route.url}`,
    })
    const docs = rows.filter(row => row.route?.url === '/docs')
    expect(docs[0]?.route?.method).toBe('GET')
    expect(rows.some(row => row.route?.url === 'status')).toBe(true)
  })
})
