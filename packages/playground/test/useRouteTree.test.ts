import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'

import { useRouteTree } from '../src/hooks/useRouteTree'

const hooks = vi.hoisted(() => ({
  mounted: [] as Array<() => void>,
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    onMounted: (cb: () => void) => {
      hooks.mounted.push(cb)
      cb()
    },
  }
})

describe('useRouteTree', () => {
  it('builds tree rows and persists expanded state', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    })

    store.set('mokup.playground.treeMode', 'route')
    store.set('mokup.playground.treeExpanded.route', JSON.stringify(['routes']))

    const routes = ref([
      { method: 'GET', url: '/api/ping', file: 'ping.get.ts', type: 'handler' },
    ])

    const selectedKey = computed(() => 'GET /api/ping')
    const searchTerm = computed(() => '')

    const tree = useRouteTree({
      routes,
      selectedKey,
      searchTerm,
      getRouteKey: route => `${route.method} ${route.url}`,
    })

    expect(tree.treeMode.value).toBe('route')
    expect(tree.treeRows.value.length).toBeGreaterThan(0)

    tree.toggleExpanded('routes')
    expect(store.get('mokup.playground.treeExpanded.route')).toBe('[]')

    tree.setTreeMode('file')
    expect(tree.treeMode.value).toBe('file')
  })

  it('initializes expanded state when none is stored', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    })

    const routes = ref([
      { method: 'GET', url: '/api/users/me', file: 'users/me.get.ts', type: 'handler' },
    ])
    const tree = useRouteTree({
      routes,
      selectedKey: computed(() => ''),
      searchTerm: computed(() => ''),
      getRouteKey: route => `${route.method} ${route.url}`,
    })

    tree.toggleExpanded('routes')
    const stored = store.get('mokup.playground.treeExpanded.file')
    expect(stored).toBeDefined()
  })

  it('ignores storage errors when loading and persisting', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('fail')
      },
      setItem: () => {
        throw new Error('fail')
      },
    })

    const routes = ref([
      { method: 'GET', url: '/api/ping', file: 'ping.get.ts', type: 'handler' },
    ])
    const tree = useRouteTree({
      routes,
      selectedKey: computed(() => ''),
      searchTerm: computed(() => ''),
      getRouteKey: route => `${route.method} ${route.url}`,
    })

    expect(() => tree.toggleExpanded('routes')).not.toThrow()
    expect(() => tree.setTreeMode('route')).not.toThrow()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
})
