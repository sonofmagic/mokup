<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PlaygroundContent from './components/PlaygroundContent.vue'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import PlaygroundSidebar from './components/PlaygroundSidebar.vue'
import { usePlaygroundCounts } from './hooks/usePlaygroundCounts'
import { usePlaygroundModeHandlers } from './hooks/usePlaygroundModeHandlers'
import { usePlaygroundRequest } from './hooks/usePlaygroundRequest'
import { usePlaygroundRoutes } from './hooks/usePlaygroundRoutes'
import { useRouteTree } from './hooks/useRouteTree'
import { useSplitPane } from './hooks/useSplitPane'

declare global {
  interface Window {
    __MOKUP_PLAYGROUND__?: {
      reloadRoutes?: () => void
    }
  }
}

const {
  routes,
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
  responseText,
  responseStatus,
  responseTime,
  runRequest,
  isSwRegistering,
  routeParams,
  paramValues,
  setParamValue,
  requestUrl,
  totalCount,
  getRouteCount,
} = usePlaygroundRequest(selected, { basePath })

const selectedKey = computed(() => (selected.value ? routeKey(selected.value) : ''))
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

function handleRefresh() {
  loadRoutes().catch(() => undefined)
}

onMounted(() => {
  setBasePath(window.location.pathname)
  restoreSplitWidth()
  window.__MOKUP_PLAYGROUND__ = {
    reloadRoutes: handleRefresh,
  }
  handleRefresh()
})

onBeforeUnmount(() => {
  stopDrag()
})
</script>

<template>
  <div class="h-screen overflow-hidden pg-app-bg" data-testid="playground-app">
    <div class="flex h-full w-full flex-col">
      <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="flex flex-1 flex-col overflow-hidden bg-pg-surface-shell">
          <div
            class="flex min-h-0 flex-1 flex-col lg:flex-row"
            :class="isDragging ? 'select-none' : ''"
            :style="splitStyle"
          >
            <PlaygroundSidebar
              v-model:search="search"
              :base-path="basePath"
              :groups="groups"
              :active-group="activeGroup"
              :tree-mode="treeMode"
              :route-mode="routeMode"
              :enabled-mode="enabledMode"
              :disabled-mode="disabledMode"
              :selected-config="selectedConfig"
              :selected-disabled="selectedDisabled"
              :selected-ignored="selectedIgnored"
              :active-total="activeTotal"
              :api-total="apiTotal"
              :disabled-total="disabledTotal"
              :ignored-total="ignoredTotal"
              :config-total="configTotal"
              :disabled-api-total="disabledApiTotal"
              :disabled-config-total="disabledConfigTotal"
              :error="error"
              :loading="loading"
              :filtered="filtered"
              :disabled-filtered="disabledFiltered"
              :ignored-filtered="ignoredFiltered"
              :config-filtered="configFiltered"
              :disabled-config-filtered="disabledConfigFiltered"
              :tree-rows="treeRows"
              :workspace-root="workspaceRoot"
              :get-route-count="getRouteCount"
              @select-group="setActiveGroup"
              @set-route-mode="setRouteMode"
              @set-enabled-mode="setEnabledMode"
              @set-disabled-mode="setDisabledMode"
              @toggle="toggleExpanded"
              @select-route="handleSelectRoute"
              @select-disabled-route="handleSelectDisabled"
              @select-ignored-route="handleSelectIgnored"
              @select-config="handleSelectConfig"
              @update:treeMode="setTreeMode"
            />

            <div class="relative hidden w-4 flex-none items-center justify-center lg:flex">
              <div class="h-full w-px bg-pg-divider" />
              <button
                class="group absolute flex h-10 w-10 cursor-col-resize items-center justify-center rounded-full border shadow-sm transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-muted hover:text-pg-text-soft"
                type="button"
                aria-label="Resize panels"
                @pointerdown="handleDragStart"
              >
                <span class="i-[carbon--drag-horizontal] h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <section class="flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-6">
              <PlaygroundHeader
                :visible-count="visibleCount"
                :total-count="totalCount"
                @refresh="handleRefresh"
              />

              <div class="mt-3 flex-1 min-h-0 overflow-auto">
                <PlaygroundContent
                  v-model:queryText="queryText"
                  v-model:headersText="headersText"
                  v-model:bodyText="bodyText"
                  v-model:bodyType="bodyType"
                  :selected="selected"
                  :selected-disabled="selectedDisabled"
                  :selected-ignored="selectedIgnored"
                  :selected-config="selectedConfig"
                  :request-url="requestUrl"
                  :workspace-root="workspaceRoot"
                  :response-text="responseText"
                  :response-status="responseStatus"
                  :response-time="responseTime"
                  :is-sw-registering="isSwRegistering"
                  :route-params="routeParams"
                  :param-values="paramValues"
                  :route-mode="routeMode"
                  :enabled-mode="enabledMode"
                  :disabled-mode="disabledMode"
                  :config-impact-routes="configImpactRoutes"
                  :config-status-map="configStatusMap"
                  @update:param-value="setParamValue"
                  @run="runRequest"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
