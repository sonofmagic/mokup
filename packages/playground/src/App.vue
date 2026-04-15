<script setup lang="ts">
import type { ApiKeyLocation, AuthType, BodyType, MultipartFileEntry, RawBodyType } from './types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PlaygroundHotReloadToast from './components/PlaygroundHotReloadToast.vue'
import PlaygroundWorkspace from './components/PlaygroundWorkspace.vue'
import { usePlaygroundCounts } from './hooks/usePlaygroundCounts'
import { usePlaygroundModeHandlers } from './hooks/usePlaygroundModeHandlers'
import { usePlaygroundRequest } from './hooks/usePlaygroundRequest'
import { usePlaygroundRoutes } from './hooks/usePlaygroundRoutes'
import { useRouteTree } from './hooks/useRouteTree'
import { useSplitPane } from './hooks/useSplitPane'

declare global { interface Window { __MOKUP_PLAYGROUND__?: { reloadRoutes?: () => void, notifyHotReload?: () => void } } }

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

const workspaceHandlers = {
  getRouteCount,
  onRefresh: handleRefresh,
  onToggleCollapse: toggleSidebar,
  onSelectGroup: setActiveGroup,
  onSetRouteMode: setRouteMode,
  onSetEnabledMode: setEnabledMode,
  onSetDisabledMode: setDisabledMode,
  onToggleTree: toggleExpanded,
  onSelectRoute: handleSelectRoute,
  onSelectDisabled: handleSelectDisabled,
  onSelectIgnored: handleSelectIgnored,
  onSelectConfig: handleSelectConfig,
  onSetTreeMode: setTreeMode,
  onDragStart: handleDragStart,
  onSetParamValue: setParamValue,
  onRunRequest: runRequest,
  onUpdateSearch: (value: string) => { search.value = value },
  onUpdateQueryText: (value: string) => { queryText.value = value },
  onUpdateHeadersText: (value: string) => { headersText.value = value },
  onUpdateBodyText: (value: string) => { bodyText.value = value },
  onUpdateBodyType: (value: BodyType) => { bodyType.value = value },
  onUpdateRawType: (value: RawBodyType) => { rawType.value = value },
  onUpdateRawValidate: (value: boolean) => { rawValidate.value = value },
  onUpdateMultipartFiles: (value: MultipartFileEntry[]) => { multipartFiles.value = value },
  onUpdateBinaryFile: (value: File | null) => { binaryFile.value = value },
  onUpdateAuthType: (value: AuthType) => { authType.value = value },
  onUpdateAuthToken: (value: string) => { authToken.value = value },
  onUpdateAuthUsername: (value: string) => { authUsername.value = value },
  onUpdateAuthPassword: (value: string) => { authPassword.value = value },
  onUpdateAuthKeyName: (value: string) => { authKeyName.value = value },
  onUpdateAuthKeyValue: (value: string) => { authKeyValue.value = value },
  onUpdateAuthKeyLocation: (value: ApiKeyLocation) => { authKeyLocation.value = value },
  onUpdateAuthCustomName: (value: string) => { authCustomName.value = value },
  onUpdateAuthCustomValue: (value: string) => { authCustomValue.value = value },
}

type WorkspaceProps = InstanceType<typeof PlaygroundWorkspace>['$props']

const workspaceProps = computed<WorkspaceProps>(() => ({
  ...Object.fromEntries(Object.entries(workspaceRefs).map(([key, value]) => [key, value.value])),
  ...workspaceHandlers,
}) as unknown as WorkspaceProps)

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
</script>

<template>
  <div class="h-screen overflow-hidden pg-app-bg" data-testid="playground-app">
    <PlaygroundHotReloadToast :visible="hotReloadVisible" />
    <PlaygroundWorkspace v-bind="workspaceProps" />
  </div>
</template>
