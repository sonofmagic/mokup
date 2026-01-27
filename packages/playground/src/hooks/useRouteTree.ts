import type { ComputedRef, Ref } from 'vue'
import type { PlaygroundRoute, TreeMode } from '../types'
import { computed, onMounted, ref } from 'vue'
import { buildRouteTree, buildTreeRows, getAllFolderIds, sortRouteTree } from '../utils/tree'

/**
 * Vue composable that builds and manages the route tree view.
 *
 * @param params - Tree inputs.
 * @param params.routes - Route list reference.
 * @param params.selectedKey - Selected route key reference.
 * @param params.searchTerm - Search term reference.
 * @param params.getRouteKey - Key resolver for routes.
 * @returns Reactive tree state and helpers.
 *
 * @example
 * import { useRouteTree } from '@mokup/playground'
 *
 * const tree = useRouteTree({ routes: [], mode: 'file' })
 */
export function useRouteTree(params: {
  routes: Ref<PlaygroundRoute[]>
  selectedKey: ComputedRef<string>
  searchTerm: ComputedRef<string>
  getRouteKey: (route: PlaygroundRoute) => string
}) {
  const treeMode = ref<TreeMode>('file')
  const expandedFile = ref<Set<string>>(new Set())
  const expandedRoute = ref<Set<string>>(new Set())
  const expandedFileOverride = ref(false)
  const expandedRouteOverride = ref(false)

  function getTreeModeKey() {
    return 'mokup.playground.treeMode'
  }

  function getExpandedKey(mode: TreeMode) {
    return `mokup.playground.treeExpanded.${mode}`
  }

  function loadExpandedState(mode: TreeMode) {
    try {
      const raw = localStorage.getItem(getExpandedKey(mode))
      if (!raw) {
        return { set: new Set<string>(), hasValue: false }
      }
      const parsed = JSON.parse(raw) as string[]
      if (!Array.isArray(parsed)) {
        return { set: new Set<string>(), hasValue: false }
      }
      return {
        set: new Set(parsed.filter(item => typeof item === 'string')),
        hasValue: true,
      }
    }
    catch {
      return { set: new Set<string>(), hasValue: false }
    }
  }

  function persistExpanded(mode: TreeMode, set: Set<string>) {
    try {
      localStorage.setItem(getExpandedKey(mode), JSON.stringify([...set]))
    }
    catch {
      // ignore storage errors
    }
  }

  function persistTreeMode(mode: TreeMode) {
    try {
      localStorage.setItem(getTreeModeKey(), mode)
    }
    catch {
      // ignore storage errors
    }
  }

  function getExpandedSet() {
    return treeMode.value === 'file' ? expandedFile.value : expandedRoute.value
  }

  function setExpandedSet(mode: TreeMode, set: Set<string>) {
    if (mode === 'file') {
      expandedFile.value = set
    }
    else {
      expandedRoute.value = set
    }
  }

  function hasExpandedOverride(mode: TreeMode) {
    return mode === 'file' ? expandedFileOverride.value : expandedRouteOverride.value
  }

  function setExpandedOverride(mode: TreeMode, value: boolean) {
    if (mode === 'file') {
      expandedFileOverride.value = value
    }
    else {
      expandedRouteOverride.value = value
    }
  }

  function isExpanded(id: string) {
    if (params.searchTerm.value) {
      return true
    }
    if (!hasExpandedOverride(treeMode.value)) {
      return true
    }
    return getExpandedSet().has(id)
  }

  function toggleExpanded(id: string) {
    const mode = treeMode.value
    if (!hasExpandedOverride(mode)) {
      const initial = new Set(getAllFolderIds(params.routes.value, mode))
      setExpandedSet(mode, initial)
      setExpandedOverride(mode, true)
    }
    const set = new Set(getExpandedSet())
    if (set.has(id)) {
      set.delete(id)
    }
    else {
      set.add(id)
    }
    setExpandedSet(mode, set)
    setExpandedOverride(mode, true)
    persistExpanded(mode, set)
  }

  function setTreeMode(mode: TreeMode) {
    treeMode.value = mode
    persistTreeMode(mode)
  }

  const treeRows = computed(() => {
    const mode = treeMode.value
    const root = buildRouteTree(params.routes.value, mode)
    sortRouteTree(root)
    return buildTreeRows({
      root,
      mode,
      isExpanded,
      selectedKey: params.selectedKey.value,
      getRouteKey: params.getRouteKey,
    })
  })

  onMounted(() => {
    try {
      const savedMode = localStorage.getItem(getTreeModeKey())
      if (savedMode === 'file' || savedMode === 'route') {
        treeMode.value = savedMode
      }
      const fileState = loadExpandedState('file')
      expandedFile.value = fileState.set
      expandedFileOverride.value = fileState.hasValue
      const routeState = loadExpandedState('route')
      expandedRoute.value = routeState.set
      expandedRouteOverride.value = routeState.hasValue
    }
    catch {
      // ignore storage errors
    }
  })

  return {
    treeMode,
    treeRows,
    toggleExpanded,
    setTreeMode,
  }
}
