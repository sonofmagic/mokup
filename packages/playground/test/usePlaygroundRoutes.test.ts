import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { usePlaygroundRoutes } from '../src/hooks/usePlaygroundRoutes'

const LAST_SELECTED_ROUTE_KEY = 'mokup.playground.lastSelectedRoute'

function clearLastSelectedRoute() {
  try {
    localStorage.removeItem(LAST_SELECTED_ROUTE_KEY)
  }
  catch {
    // ignore storage errors
  }
}

describe('usePlaygroundRoutes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    clearLastSelectedRoute()
  })

  it('loads routes, applies filters, and restores last selection', async () => {
    localStorage.setItem(LAST_SELECTED_ROUTE_KEY, 'GET /api/ping')
    const routesState = usePlaygroundRoutes()
    routesState.setBasePath('/__mokup/')

    const data = {
      routes: [
        { method: 'GET', url: '/api/ping', file: 'ping.get.ts', type: 'handler', groupKey: 'g1', configChain: ['index.config.ts'] },
        { method: 'POST', url: '/api/save', file: 'save.post.ts', type: 'handler', groupKey: 'g2' },
      ],
      disabled: [
        { file: 'off.get.ts', reason: 'disabled', method: 'GET', url: '/off', groupKey: 'g1' },
      ],
      ignored: [
        { file: 'bad.txt', reason: 'ignored', groupKey: 'g2' },
      ],
      configs: [
        { file: 'index.config.ts', groupKey: 'g1' },
      ],
      disabledConfigs: [
        { file: 'disabled.config.ts', groupKey: 'g2' },
      ],
      groups: [
        { key: 'g1', label: 'Group 1', path: '/root/mock/g1' },
        { key: 'g2', label: 'Group 2', path: '/root/mock/g2' },
      ],
      root: '/root',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }))

    await routesState.loadRoutes()

    expect(fetch).toHaveBeenCalledWith('/__mokup/routes')
    expect(routesState.routes.value).toHaveLength(2)
    expect(routesState.configStatusMap.value.get('index.config.ts')).toBe('enabled')
    expect(routesState.configStatusMap.value.get('disabled.config.ts')).toBe('disabled')
    expect(routesState.selected.value?.url).toBe('/api/ping')

    routesState.search.value = 'save'
    await nextTick()
    expect(routesState.filtered.value).toHaveLength(1)

    routesState.setActiveGroup('g2')
    expect(routesState.filtered.value).toHaveLength(1)
    expect(routesState.filtered.value[0]?.url).toBe('/api/save')

    routesState.selectConfig({ file: 'index.config.ts' })
    await nextTick()
    expect(routesState.configImpactRoutes.value[0]?.file).toBe('ping.get.ts')
  })

  it('leaves selection empty without a stored route', async () => {
    const routesState = usePlaygroundRoutes()
    routesState.setBasePath('/__mokup/')

    const data = {
      routes: [
        { method: 'GET', url: '/api/ping', file: 'ping.get.ts', type: 'handler', groupKey: 'g1' },
      ],
      disabled: [],
      ignored: [],
      configs: [],
      disabledConfigs: [],
      groups: [
        { key: 'g1', label: 'Group 1', path: '/root/mock/g1' },
      ],
      root: '/root',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }))

    await routesState.loadRoutes()

    expect(routesState.selected.value).toBeNull()
  })

  it('captures load errors', async () => {
    const routesState = usePlaygroundRoutes()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    }))

    await routesState.loadRoutes()
    expect(routesState.error.value).toContain('Failed to load routes')
  })

  it('restores selections and resets invalid groups', async () => {
    const routesState = usePlaygroundRoutes()
    routesState.activeGroup.value = 'missing'
    routesState.selected.value = { method: 'GET', url: '/api/ping', file: 'ping.get.ts', type: 'handler' }
    routesState.selectedDisabled.value = { file: 'off.get.ts', reason: 'disabled' }
    routesState.selectedIgnored.value = { file: 'bad.txt', reason: 'ignored' }
    routesState.selectedConfig.value = { file: 'index.config.ts' }

    const data = {
      routes: [
        { method: 'GET', url: '/api/ping', file: 'ping.get.ts', type: 'handler' },
      ],
      disabled: [
        { file: 'off.get.ts', reason: 'disabled', method: 'GET', url: '/off' },
      ],
      ignored: [
        { file: 'bad.txt', reason: 'ignored' },
      ],
      configs: [
        { file: 'index.config.ts' },
      ],
      disabledConfigs: [],
      groups: [
        { key: 'g1', label: 'Group 1', path: '/root/mock/g1' },
      ],
      root: '/root',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }))

    await routesState.loadRoutes()

    expect(routesState.activeGroup.value).toBe('all')
    expect(routesState.selected.value?.url).toBe('/api/ping')
    expect(routesState.selectedDisabled.value?.file).toBe('off.get.ts')
    expect(routesState.selectedIgnored.value?.file).toBe('bad.txt')
    expect(routesState.selectedConfig.value?.file).toBe('index.config.ts')
  })

  it('filters configs, disabled, and ignored lists', async () => {
    const routesState = usePlaygroundRoutes()
    const data = {
      routes: [
        { method: 'GET', url: '/api/alpha', file: 'alpha.get.ts', type: 'handler', groupKey: 'g1' },
        { method: 'GET', url: '/api/bravo', file: 'bravo.get.ts', type: 'handler', groupKey: 'g2' },
      ],
      disabled: [
        { file: 'disabled.get.ts', reason: 'disabled', method: 'GET', url: '/disabled', groupKey: 'g2' },
      ],
      ignored: [
        { file: 'ignored.txt', reason: 'ignored', groupKey: 'g1' },
      ],
      configs: [
        { file: 'alpha.config.ts', groupKey: 'g1' },
      ],
      disabledConfigs: [
        { file: 'beta.config.ts', groupKey: 'g2' },
      ],
      groups: [
        { key: 'g1', label: 'Group 1', path: '/root/mock/g1' },
        { key: 'g2', label: 'Group 2', path: '/root/mock/g2' },
      ],
      root: '/root',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }))

    await routesState.loadRoutes()

    routesState.search.value = 'alpha'
    await nextTick()
    expect(routesState.filtered.value).toHaveLength(1)
    expect(routesState.configFiltered.value).toHaveLength(1)
    expect(routesState.disabledConfigFiltered.value).toHaveLength(0)

    routesState.search.value = 'beta'
    await nextTick()
    expect(routesState.configFiltered.value).toHaveLength(0)
    expect(routesState.disabledConfigFiltered.value).toHaveLength(1)

    routesState.search.value = 'disabled'
    await nextTick()
    expect(routesState.disabledFiltered.value).toHaveLength(1)

    routesState.search.value = 'ignored'
    await nextTick()
    expect(routesState.ignoredFiltered.value).toHaveLength(1)

    routesState.search.value = ''
    await nextTick()
    expect(routesState.disabledFiltered.value).toHaveLength(1)
    expect(routesState.ignoredFiltered.value).toHaveLength(1)
    routesState.selected.value = data.routes[0] as any
    routesState.setActiveGroup('g2')
    expect(routesState.selected.value).toBeNull()
  })

  it('keeps selection when active group still contains the route', async () => {
    const routesState = usePlaygroundRoutes()
    const data = {
      routes: [
        { method: 'GET', url: '/api/alpha', file: 'alpha.get.ts', type: 'handler', groupKey: 'g1' },
        { method: 'GET', url: '/api/bravo', file: 'bravo.get.ts', type: 'handler', groupKey: 'g2' },
      ],
      disabled: [],
      ignored: [],
      configs: [],
      disabledConfigs: [],
      groups: [
        { key: 'g1', label: 'Group 1', path: '/root/mock/g1' },
        { key: 'g2', label: 'Group 2', path: '/root/mock/g2' },
      ],
      root: '/root',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }))

    await routesState.loadRoutes()
    routesState.selected.value = data.routes[0] as any
    routesState.setActiveGroup('g1')
    expect(routesState.selected.value?.file).toBe('alpha.get.ts')
  })

  it('handles missing previous selections and config lookups', async () => {
    const routesState = usePlaygroundRoutes()
    routesState.lastSelectedKey.value = 'GET /missing'
    routesState.selectedDisabled.value = { file: 'missing.ts', reason: 'disabled' }
    routesState.selectedIgnored.value = { file: 'missing.txt', reason: 'ignored' }
    routesState.selectedConfig.value = { file: 'disabled.config.ts' }

    const data = {
      routes: [
        { method: 'GET', url: '/api/alpha', file: 'alpha.get.ts', type: 'handler' },
      ],
      disabled: [
        { file: 'disabled.get.ts', reason: 'disabled', method: 'GET', url: '/disabled' },
      ],
      ignored: [
        { file: 'ignored.txt', reason: 'ignored' },
      ],
      configs: [],
      disabledConfigs: [
        { file: 'disabled.config.ts' },
      ],
      groups: [],
      root: '/root',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }))

    await routesState.loadRoutes()

    expect(routesState.selected.value).toBeNull()
    expect(routesState.selectedDisabled.value?.file).toBe('disabled.get.ts')
    expect(routesState.selectedIgnored.value?.file).toBe('ignored.txt')
    expect(routesState.selectedConfig.value?.file).toBe('disabled.config.ts')
  })

  it('exposes counts and config impact without selection', async () => {
    const routesState = usePlaygroundRoutes()
    const data = {
      routes: [
        { method: 'GET', url: '/api/alpha', file: 'alpha.get.ts', type: 'handler' },
      ],
      disabled: [],
      ignored: [],
      configs: [],
      disabledConfigs: [],
      groups: [],
      root: '/root',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }))

    await routesState.loadRoutes()
    routesState.selectConfig(null)
    routesState.selectRoute(null)
    routesState.selectDisabledRoute(null)
    routesState.selectIgnoredRoute(null)

    expect(routesState.routeCount.value).toBe(1)
    expect(routesState.disabledCount.value).toBe(0)
    expect(routesState.ignoredCount.value).toBe(0)
    expect(routesState.configCount.value).toBe(0)
    expect(routesState.disabledConfigCount.value).toBe(0)
    expect(routesState.configImpactRoutes.value).toHaveLength(0)
  })

  it('reports non-error fetch failures', async () => {
    const routesState = usePlaygroundRoutes()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('boom'))
    await routesState.loadRoutes()
    expect(routesState.error.value).toBe('boom')
  })

  it('handles missing response fields and empty selections', async () => {
    const routesState = usePlaygroundRoutes()
    routesState.lastSelectedKey.value = 'GET /missing'
    routesState.selectedDisabled.value = { file: 'missing.ts', reason: 'disabled' }
    routesState.selectedIgnored.value = { file: 'missing.txt', reason: 'ignored' }
    routesState.selectedConfig.value = { file: 'missing.config.ts' }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    }))

    await routesState.loadRoutes()

    expect(routesState.routes.value).toEqual([])
    expect(routesState.disabledRoutes.value).toEqual([])
    expect(routesState.ignoredRoutes.value).toEqual([])
    expect(routesState.configFiles.value).toEqual([])
    expect(routesState.disabledConfigFiles.value).toEqual([])
    expect(routesState.groups.value).toEqual([])
    expect(routesState.workspaceRoot.value).toBe('')
    expect(routesState.selected.value).toBeNull()
    expect(routesState.selectedDisabled.value).toBeNull()
    expect(routesState.selectedIgnored.value).toBeNull()
    expect(routesState.selectedConfig.value).toBeNull()
  })

  it('filters disabled routes without method or url', async () => {
    const routesState = usePlaygroundRoutes()
    const data = {
      routes: [],
      disabled: [
        { file: 'disabled.get.ts', reason: 'disabled' },
      ],
      ignored: [],
      configs: [],
      disabledConfigs: [],
      groups: [],
      root: '/root',
    }

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }))

    await routesState.loadRoutes()

    routesState.search.value = 'disabled'
    await nextTick()
    expect(routesState.disabledFiltered.value).toHaveLength(1)
  })
})
