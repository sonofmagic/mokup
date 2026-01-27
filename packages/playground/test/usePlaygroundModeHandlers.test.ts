import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { usePlaygroundModeHandlers } from '../src/hooks/usePlaygroundModeHandlers'

describe('usePlaygroundModeHandlers', () => {
  it('switches modes and selections', () => {
    const route = { method: 'GET', url: '/a', file: 'a.ts', type: 'handler' }
    const disabledRoute = { file: 'b.ts', reason: 'disabled' }
    const ignoredRoute = { file: 'c.ts', reason: 'ignored' }
    const config = { file: 'index.config.ts' }

    const routeMode = ref<'active' | 'disabled' | 'ignored'>('active')
    const enabledMode = ref<'api' | 'config'>('api')
    const disabledMode = ref<'api' | 'config'>('api')
    const selected = ref(route)
    const selectedDisabled = ref<typeof disabledRoute | null>(null)
    const selectedIgnored = ref<typeof ignoredRoute | null>(null)
    const selectedConfig = ref<typeof config | null>(null)
    const filtered = ref([route])
    const disabledFiltered = ref([disabledRoute])
    const ignoredFiltered = ref([ignoredRoute])
    const lastSelectedKey = ref('GET /a')

    const handlers = usePlaygroundModeHandlers({
      routeMode,
      enabledMode,
      disabledMode,
      selected,
      selectedDisabled,
      selectedIgnored,
      selectedConfig,
      filtered,
      disabledFiltered,
      ignoredFiltered,
      lastSelectedKey,
      getRouteKey: r => `${r.method} ${r.url}`,
      selectRoute: (value) => {
        selected.value = value
      },
      selectDisabledRoute: (value) => {
        selectedDisabled.value = value
      },
      selectIgnoredRoute: (value) => {
        selectedIgnored.value = value
      },
      selectConfig: (value) => {
        selectedConfig.value = value
      },
    })

    handlers.setRouteMode('disabled')
    expect(routeMode.value).toBe('disabled')
    expect(selected.value).toBeNull()
    expect(selectedDisabled.value).toEqual(disabledRoute)

    handlers.setRouteMode('ignored')
    expect(selectedIgnored.value).toEqual(ignoredRoute)

    handlers.setRouteMode('active')
    expect(selected.value).toEqual(route)

    handlers.setEnabledMode('config')
    expect(selected.value).toBeNull()

    handlers.setDisabledMode('config')
    expect(selectedDisabled.value).toBeNull()

    handlers.handleSelectRoute(route)
    expect(selected.value).toEqual(route)
    expect(selectedConfig.value).toBeNull()
  })

  it('handles config and disabled selections', () => {
    const route = { method: 'GET', url: '/a', file: 'a.ts', type: 'handler' }
    const disabledRoute = { file: 'b.ts', reason: 'disabled' }
    const ignoredRoute = { file: 'c.ts', reason: 'ignored' }
    const config = { file: 'index.config.ts' }

    const routeMode = ref<'active' | 'disabled' | 'ignored'>('active')
    const enabledMode = ref<'api' | 'config'>('config')
    const disabledMode = ref<'api' | 'config'>('config')
    const selected = ref<typeof route | null>(null)
    const selectedDisabled = ref<typeof disabledRoute | null>(null)
    const selectedIgnored = ref<typeof ignoredRoute | null>(null)
    const selectedConfig = ref<typeof config | null>(config)
    const filtered = ref([route])
    const disabledFiltered = ref([disabledRoute])
    const ignoredFiltered = ref([ignoredRoute])
    const lastSelectedKey = ref('GET /a')

    const handlers = usePlaygroundModeHandlers({
      routeMode,
      enabledMode,
      disabledMode,
      selected,
      selectedDisabled,
      selectedIgnored,
      selectedConfig,
      filtered,
      disabledFiltered,
      ignoredFiltered,
      lastSelectedKey,
      getRouteKey: r => `${r.method} ${r.url}`,
      selectRoute: (value) => {
        selected.value = value
      },
      selectDisabledRoute: (value) => {
        selectedDisabled.value = value
      },
      selectIgnoredRoute: (value) => {
        selectedIgnored.value = value
      },
      selectConfig: (value) => {
        selectedConfig.value = value
      },
    })

    handlers.setEnabledMode('api')
    expect(selected.value).toEqual(route)

    handlers.setDisabledMode('api')
    expect(selectedDisabled.value).toEqual(disabledRoute)

    handlers.handleSelectConfig(config)
    expect(selectedConfig.value).toEqual(config)
    expect(selected.value).toBeNull()

    handlers.handleSelectDisabled(disabledRoute)
    expect(selectedDisabled.value).toEqual(disabledRoute)
    expect(selectedIgnored.value).toBeNull()

    handlers.handleSelectIgnored(ignoredRoute)
    expect(selectedIgnored.value).toEqual(ignoredRoute)
    expect(selectedDisabled.value).toBeNull()
  })

  it('handles empty last selections and config disabled mode', () => {
    const routeMode = ref<'active' | 'disabled' | 'ignored'>('active')
    const enabledMode = ref<'api' | 'config'>('api')
    const disabledMode = ref<'api' | 'config'>('config')
    const selected = ref<null>(null)
    const selectedDisabled = ref<null>(null)
    const selectedIgnored = ref<null>(null)
    const selectedConfig = ref<null>(null)
    const filtered = ref([] as any[])
    const disabledFiltered = ref([] as any[])
    const ignoredFiltered = ref([] as any[])
    const lastSelectedKey = ref('')

    const handlers = usePlaygroundModeHandlers({
      routeMode,
      enabledMode,
      disabledMode,
      selected,
      selectedDisabled,
      selectedIgnored,
      selectedConfig,
      filtered,
      disabledFiltered,
      ignoredFiltered,
      lastSelectedKey,
      getRouteKey: r => `${r.method} ${r.url}`,
      selectRoute: (value) => {
        selected.value = value as never
      },
      selectDisabledRoute: (value) => {
        selectedDisabled.value = value as never
      },
      selectIgnoredRoute: (value) => {
        selectedIgnored.value = value as never
      },
      selectConfig: (value) => {
        selectedConfig.value = value as never
      },
    })

    handlers.setRouteMode('disabled')
    expect(routeMode.value).toBe('disabled')
    expect(selectedDisabled.value).toBeNull()

    handlers.setRouteMode('active')
    expect(selected.value).toBeNull()
  })

  it('handles empty filtered lists and missing last selection', () => {
    const routeMode = ref<'active' | 'disabled' | 'ignored'>('active')
    const enabledMode = ref<'api' | 'config'>('api')
    const disabledMode = ref<'api' | 'config'>('api')
    const selected = ref<null>(null)
    const selectedDisabled = ref<null>(null)
    const selectedIgnored = ref<null>(null)
    const selectedConfig = ref<null>(null)
    const filtered = ref([{ method: 'GET', url: '/a', file: 'a.ts', type: 'handler' }])
    const disabledFiltered = ref([] as any[])
    const ignoredFiltered = ref([] as any[])
    const lastSelectedKey = ref('GET /missing')

    const handlers = usePlaygroundModeHandlers({
      routeMode,
      enabledMode,
      disabledMode,
      selected,
      selectedDisabled,
      selectedIgnored,
      selectedConfig,
      filtered,
      disabledFiltered,
      ignoredFiltered,
      lastSelectedKey,
      getRouteKey: r => `${r.method} ${r.url}`,
      selectRoute: (value) => {
        selected.value = value as never
      },
      selectDisabledRoute: (value) => {
        selectedDisabled.value = value as never
      },
      selectIgnoredRoute: (value) => {
        selectedIgnored.value = value as never
      },
      selectConfig: (value) => {
        selectedConfig.value = value as never
      },
    })

    handlers.setRouteMode('disabled')
    expect(selectedDisabled.value).toBeNull()

    handlers.setRouteMode('ignored')
    expect(selectedIgnored.value).toBeNull()

    handlers.setEnabledMode('api')
    expect(selected.value).toBeNull()

    handlers.setDisabledMode('api')
    expect(selectedDisabled.value).toBeNull()
  })
})
