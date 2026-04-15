import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { usePlaygroundCounts } from './usePlaygroundCounts'
import { usePlaygroundModeHandlers } from './usePlaygroundModeHandlers'
import { usePlaygroundRequest } from './usePlaygroundRequest'
import { usePlaygroundRoutes } from './usePlaygroundRoutes'
import { usePlaygroundWorkspaceProps } from './usePlaygroundWorkspaceProps'
import { useRouteTree } from './useRouteTree'
import { useSplitPane } from './useSplitPane'

declare global {
  interface Window {
    __MOKUP_PLAYGROUND__?: {
      reloadRoutes?: () => void
      notifyHotReload?: () => void
    }
  }
}

export function usePlaygroundAppState() {
  const {
    routes,
    disabledRoutes,
    ignoredRoutes,
    configFiles,
    disabledConfigFiles,
    filtered,
    disabledFiltered,
    ignoredFiltered,
    configFiltered,
    disabledConfigFiltered,
    selected,
    selectedDisabled,
    selectedIgnored,
    selectedConfig,
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
    ignoredCount,
    configCount,
    disabledConfigCount,
    configStatusMap,
    routeKey,
    lastSelectedKey,
    loadRoutes,
    setActiveGroup,
    selectRoute,
    selectDisabledRoute,
    selectIgnoredRoute,
    selectConfig,
    setBasePath,
    configImpactRoutes,
  } = usePlaygroundRoutes()

  const {
    queryText,
    headersText,
    bodyText,
    bodyType,
    rawType,
    rawValidate,
    multipartFiles,
    binaryFile,
    authType,
    authToken,
    authUsername,
    authPassword,
    authKeyName,
    authKeyValue,
    authKeyLocation,
    authCustomName,
    authCustomValue,
    responseRaw,
    responsePretty,
    responseHeaders,
    responseContentType,
    responseStatus,
    responseTime,
    runRequest,
    isSwMode,
    isSwRegistering,
    routeParams,
    paramValues,
    missingParams,
    missingPulse,
    setParamValue,
    requestUrl,
    totalCount,
    getRouteCount,
  } = usePlaygroundRequest(selected, { basePath })

  const selectedKey = computed(() => (selected.value ? routeKey(selected.value) : ''))
  const hasCachedData = computed(() => {
    return routes.value.length > 0
      || disabledRoutes.value.length > 0
      || ignoredRoutes.value.length > 0
      || configFiles.value.length > 0
      || disabledConfigFiles.value.length > 0
  })
  const requestMode = computed<'server' | 'sw' | 'sw-registering'>(() => {
    if (isSwMode.value) {
      return isSwRegistering.value ? 'sw-registering' : 'sw'
    }
    return 'server'
  })
  const routeMode = ref<'active' | 'disabled' | 'ignored'>('active')
  const enabledMode = ref<'api' | 'config'>('api')
  const disabledMode = ref<'api' | 'config'>('api')
  const {
    activeTotal,
    apiTotal,
    disabledTotal,
    ignoredTotal,
    configTotal,
    disabledConfigTotal,
    disabledApiTotal,
    visibleCount,
  } = usePlaygroundCounts({
    routes,
    configCount,
    disabledCount,
    ignoredCount,
    disabledConfigCount,
    routeCount,
    disabledFiltered,
    ignoredFiltered,
    configFiltered,
    disabledConfigFiltered,
    routeMode,
    enabledMode,
    disabledMode,
  })

  const {
    setRouteMode,
    setEnabledMode,
    setDisabledMode,
    handleSelectRoute,
    handleSelectConfig,
    handleSelectDisabled,
    handleSelectIgnored,
  } = usePlaygroundModeHandlers({
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
    getRouteKey: routeKey,
    selectRoute,
    selectDisabledRoute,
    selectIgnoredRoute,
    selectConfig,
  })
  const {
    splitStyle,
    isDragging,
    handleDragStart,
    restoreSplitWidth,
    stopDrag,
    splitWidth,
  } = useSplitPane({
    storageKey: 'mokup:playground:split-width',
    defaultWidth: 320,
    minWidth: 240,
    maxWidth: 560,
  })
  const { treeMode, treeRows, toggleExpanded, setTreeMode } = useRouteTree({
    routes: filtered,
    selectedKey,
    searchTerm,
    getRouteKey: routeKey,
  })
  const hotReloadVisible = ref(false)
  const hotReloadTimer = ref<number | null>(null)
  const sidebarCollapsed = ref(false)
  const sidebarLastWidth = ref(320)
  const sidebarCollapsedKey = 'mokup.playground.sidebarCollapsed'
  const sidebarCollapsedWidth = 72

  function handleRefresh() {
    loadRoutes().catch(() => undefined)
  }

  function notifyHotReload() {
    if (hotReloadTimer.value) {
      window.clearTimeout(hotReloadTimer.value)
    }
    hotReloadVisible.value = true
    hotReloadTimer.value = window.setTimeout(() => {
      hotReloadVisible.value = false
      hotReloadTimer.value = null
    }, 2000)
  }

  function toggleSidebar() {
    if (sidebarCollapsed.value) {
      sidebarCollapsed.value = false
      splitWidth.value = sidebarLastWidth.value
    }
    else {
      sidebarLastWidth.value = splitWidth.value
      sidebarCollapsed.value = true
      splitWidth.value = sidebarCollapsedWidth
    }
    localStorage.setItem(sidebarCollapsedKey, String(sidebarCollapsed.value))
  }

  const workspaceRefs = {
    search,
    isDragging,
    splitStyle,
    sidebarCollapsed,
    basePath,
    groups,
    activeGroup,
    treeMode,
    routeMode,
    enabledMode,
    disabledMode,
    selectedConfig,
    selectedDisabled,
    selectedIgnored,
    activeTotal,
    apiTotal,
    disabledTotal,
    ignoredTotal,
    configTotal,
    disabledApiTotal,
    disabledConfigTotal,
    error,
    loading,
    hasCachedData,
    filtered,
    disabledFiltered,
    ignoredFiltered,
    configFiltered,
    disabledConfigFiltered,
    treeRows,
    workspaceRoot,
    visibleCount,
    totalCount,
    requestMode,
    selected,
    requestUrl,
    queryText,
    headersText,
    bodyText,
    bodyType,
    rawType,
    rawValidate,
    multipartFiles,
    binaryFile,
    authType,
    authToken,
    authUsername,
    authPassword,
    authKeyName,
    authKeyValue,
    authKeyLocation,
    authCustomName,
    authCustomValue,
    responseRaw,
    responsePretty,
    responseHeaders,
    responseContentType,
    responseStatus,
    responseTime,
    isSwRegistering,
    routeParams,
    paramValues,
    missingParams,
    missingPulse,
    configImpactRoutes,
    configStatusMap,
  }

  const { workspaceProps } = usePlaygroundWorkspaceProps({
    refs: workspaceRefs,
    getRouteCount,
    handleRefresh,
    toggleSidebar,
    setActiveGroup,
    setRouteMode,
    setEnabledMode,
    setDisabledMode,
    toggleExpanded,
    handleSelectRoute,
    handleSelectDisabled,
    handleSelectIgnored,
    handleSelectConfig,
    setTreeMode,
    handleDragStart,
    setParamValue,
    runRequest,
    search,
    queryText,
    headersText,
    bodyText,
    bodyType,
    rawType,
    rawValidate,
    multipartFiles,
    binaryFile,
    authType,
    authToken,
    authUsername,
    authPassword,
    authKeyName,
    authKeyValue,
    authKeyLocation,
    authCustomName,
    authCustomValue,
  })

  onMounted(() => {
    setBasePath(window.location.pathname)
    restoreSplitWidth()
    sidebarLastWidth.value = splitWidth.value
    const storedCollapsed = localStorage.getItem(sidebarCollapsedKey)
    if (storedCollapsed === 'true') {
      sidebarCollapsed.value = true
      splitWidth.value = sidebarCollapsedWidth
    }
    window.__MOKUP_PLAYGROUND__ = {
      reloadRoutes: handleRefresh,
      notifyHotReload,
    }
    handleRefresh()
  })

  onBeforeUnmount(() => {
    stopDrag()
    if (hotReloadTimer.value) {
      window.clearTimeout(hotReloadTimer.value)
    }
  })

  return {
    hotReloadVisible,
    workspaceProps,
  }
}
