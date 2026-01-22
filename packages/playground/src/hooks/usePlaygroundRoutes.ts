import type {
  PlaygroundDisabledRoute,
  PlaygroundGroup,
  PlaygroundResponse,
  PlaygroundRoute,
} from '../types'
import { computed, ref, watch } from 'vue'
import { normalizeBasePath } from '../utils/path'

export function usePlaygroundRoutes() {
  const routes = ref<PlaygroundRoute[]>([])
  const disabledRoutes = ref<PlaygroundDisabledRoute[]>([])
  const filtered = ref<PlaygroundRoute[]>([])
  const selected = ref<PlaygroundRoute | null>(null)
  const groups = ref<PlaygroundGroup[]>([])
  const activeGroup = ref('all')
  const loading = ref(false)
  const error = ref('')
  const search = ref('')
  const basePath = ref('')
  const workspaceRoot = ref('')

  const searchTerm = computed(() => search.value.trim().toLowerCase())
  const routeCount = computed(() => filtered.value.length)
  const disabledCount = computed(() => disabledRoutes.value.length)
  const routesEndpoint = computed(() => {
    const base = basePath.value || ''
    return `${base}/routes`
  })

  const routeKey = (route: PlaygroundRoute) => `${route.method} ${route.url}`

  function getGroupRoutes() {
    return activeGroup.value === 'all'
      ? routes.value
      : routes.value.filter(route => route.groupKey === activeGroup.value)
  }

  function applyFilter() {
    const term = searchTerm.value
    const list = getGroupRoutes()
    filtered.value = term
      ? list.filter(route =>
          `${route.method} ${route.url} ${route.file}`.toLowerCase().includes(term),
        )
      : [...list]
  }

  const disabledFiltered = computed(() => {
    const term = searchTerm.value
    if (!term) {
      return [...disabledRoutes.value]
    }
    return disabledRoutes.value.filter(route =>
      `${route.method ?? ''} ${route.url ?? ''} ${route.file} ${route.reason}`
        .toLowerCase()
        .includes(term),
    )
  })

  function setActiveGroup(key: string) {
    activeGroup.value = key
    applyFilter()
    if (selected.value) {
      const selectedInList = filtered.value.some(route => routeKey(route) === routeKey(selected.value!))
      if (selectedInList) {
        return
      }
    }
    selected.value = filtered.value[0] ?? null
  }

  function selectRoute(route: PlaygroundRoute | null) {
    selected.value = route
  }

  function setBasePath(pathname: string) {
    basePath.value = normalizeBasePath(pathname)
  }

  async function loadRoutes() {
    loading.value = true
    error.value = ''
    const previousKey = selected.value ? routeKey(selected.value) : ''
    const previousGroup = activeGroup.value
    try {
      const response = await fetch(routesEndpoint.value)
      if (!response.ok) {
        throw new Error(`Failed to load routes: ${response.status}`)
      }
      const data = await response.json() as PlaygroundResponse
      routes.value = data.routes ?? []
      disabledRoutes.value = data.disabled ?? []
      groups.value = data.groups ?? []
      workspaceRoot.value = data.root ?? ''
      if (previousGroup !== 'all') {
        const exists = groups.value.some(group => group.key === previousGroup)
        if (!exists) {
          activeGroup.value = 'all'
        }
      }
      applyFilter()
      if (previousKey) {
        const match = filtered.value.find(route => routeKey(route) === previousKey)
        selected.value = match ?? filtered.value[0] ?? null
      }
      else {
        selected.value = filtered.value[0] ?? null
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    }
    finally {
      loading.value = false
    }
  }

  watch(search, () => {
    applyFilter()
  })

  return {
    routes,
    disabledRoutes,
    disabledFiltered,
    filtered,
    selected,
    groups,
    activeGroup,
    loading,
    error,
    search,
    basePath,
    workspaceRoot,
    searchTerm,
    routeCount,
    disabledCount,
    routeKey,
    loadRoutes,
    setActiveGroup,
    selectRoute,
    setBasePath,
  }
}
