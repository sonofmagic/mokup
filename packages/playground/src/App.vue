<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PlaygroundContent from './components/PlaygroundContent.vue'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import PlaygroundSidebar from './components/PlaygroundSidebar.vue'
import { usePlaygroundRequest } from './hooks/usePlaygroundRequest'
import { usePlaygroundRoutes } from './hooks/usePlaygroundRoutes'
import { useRouteTree } from './hooks/useRouteTree'

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
  disabledRoutes,
  disabledFiltered,
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
  routeKey,
  loadRoutes,
  setActiveGroup,
  selectRoute,
  setBasePath,
} = usePlaygroundRoutes()

const {
  queryText,
  headersText,
  bodyText,
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
const routeMode = ref<'active' | 'disabled'>('active')
const isDisabledMode = computed(() => routeMode.value === 'disabled')
const activeTotal = computed(() => routes.value.length)
const disabledTotal = computed(() => disabledRoutes.value.length)
const visibleCount = computed(() =>
  isDisabledMode.value ? disabledFiltered.value.length : routeCount.value,
)

const splitStorageKey = 'mokup:playground:split-width'
const minSplitWidth = 240
const maxSplitWidth = 560
const splitWidth = ref(320)
const isDragging = ref(false)
let dragStartX = 0
let dragStartWidth = 0

const splitStyle = computed(() => ({
  '--left-width': `${splitWidth.value}px`,
}))

const { treeMode, treeRows, toggleExpanded, setTreeMode } = useRouteTree({
  routes: filtered,
  selectedKey,
  searchTerm,
  getRouteKey: routeKey,
})

function setRouteMode(mode: 'active' | 'disabled') {
  routeMode.value = mode
  if (mode === 'disabled') {
    selectRoute(null)
  }
}

function clampSplitWidth(value: number) {
  return Math.min(maxSplitWidth, Math.max(minSplitWidth, value))
}

function handleDragMove(event: PointerEvent) {
  if (!isDragging.value) {
    return
  }
  const delta = event.clientX - dragStartX
  splitWidth.value = clampSplitWidth(dragStartWidth + delta)
}

function stopDrag() {
  if (!isDragging.value) {
    return
  }
  isDragging.value = false
  window.removeEventListener('pointermove', handleDragMove)
  window.removeEventListener('pointerup', stopDrag)
  localStorage.setItem(splitStorageKey, String(splitWidth.value))
}

function handleDragStart(event: PointerEvent) {
  if (event.button !== 0) {
    return
  }
  event.preventDefault()
  isDragging.value = true
  dragStartX = event.clientX
  dragStartWidth = splitWidth.value
  window.addEventListener('pointermove', handleDragMove)
  window.addEventListener('pointerup', stopDrag)
}

function handleRefresh() {
  loadRoutes().catch(() => undefined)
}

onMounted(() => {
  setBasePath(window.location.pathname)
  const stored = Number(localStorage.getItem(splitStorageKey))
  if (Number.isFinite(stored) && stored > 0) {
    splitWidth.value = clampSplitWidth(stored)
  }
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
              :is-disabled-mode="isDisabledMode"
              :active-total="activeTotal"
              :disabled-total="disabledTotal"
              :error="error"
              :loading="loading"
              :filtered="filtered"
              :disabled-filtered="disabledFiltered"
              :tree-rows="treeRows"
              :workspace-root="workspaceRoot"
              :get-route-count="getRouteCount"
              @select-group="setActiveGroup"
              @set-route-mode="setRouteMode"
              @toggle="toggleExpanded"
              @select-route="selectRoute"
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
                  :selected="selected"
                  :request-url="requestUrl"
                  :workspace-root="workspaceRoot"
                  :response-text="responseText"
                  :response-status="responseStatus"
                  :response-time="responseTime"
                  :is-sw-registering="isSwRegistering"
                  :route-params="routeParams"
                  :param-values="paramValues"
                  :is-disabled-mode="isDisabledMode"
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
