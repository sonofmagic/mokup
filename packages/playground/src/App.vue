<script setup lang="ts">
import type { PlaygroundLocale } from './i18n'
import type { TreeRow } from './types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PlaygroundFilters from './components/PlaygroundFilters.vue'
import PlaygroundTabs from './components/PlaygroundTabs.vue'
import RouteDetail from './components/RouteDetail.vue'
import RouteTree from './components/RouteTree.vue'
import TreeModeToggle from './components/TreeModeToggle.vue'
import { usePlaygroundRequest } from './hooks/usePlaygroundRequest'
import { usePlaygroundRoutes } from './hooks/usePlaygroundRoutes'
import { usePlaygroundTheme } from './hooks/usePlaygroundTheme'
import { useRouteTree } from './hooks/useRouteTree'
import { persistLocale } from './i18n'

declare global {
  interface Window {
    __MOKUP_PLAYGROUND__?: {
      reloadRoutes?: () => void
    }
  }
}

const {
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
} = usePlaygroundRequest(selected)

const { locale, t } = useI18n()
const { themeMode, effectiveTheme, cycleThemeMode } = usePlaygroundTheme()

const selectedKey = computed(() => (selected.value ? routeKey(selected.value) : ''))
const themeIcon = computed(() =>
  effectiveTheme.value === 'dark' ? 'i-[carbon--moon]' : 'i-[carbon--sun]',
)
const themeLabel = computed(() => t(`theme.${themeMode.value}`))
const localeLabel = computed(() => (locale.value === 'zh-CN' ? '中文' : 'EN'))

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

const showMore = ref(false)
const moreButtonRef = ref<HTMLButtonElement | null>(null)
const morePanelRef = ref<HTMLDivElement | null>(null)

function toggleLocale() {
  const next = locale.value === 'en-US' ? 'zh-CN' : 'en-US'
  locale.value = next
  persistLocale(next as PlaygroundLocale)
}

function handleSelectRow(row: TreeRow) {
  if (row.route) {
    selectRoute(row.route)
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

function toggleMore() {
  showMore.value = !showMore.value
}

function handleOutsideMoreClick(event: PointerEvent) {
  if (!showMore.value) {
    return
  }
  const target = event.target as Node | null
  if (!target) {
    return
  }
  if (morePanelRef.value?.contains(target) || moreButtonRef.value?.contains(target)) {
    return
  }
  showMore.value = false
}

onMounted(() => {
  setBasePath(window.location.pathname)
  const stored = Number(localStorage.getItem(splitStorageKey))
  if (Number.isFinite(stored) && stored > 0) {
    splitWidth.value = clampSplitWidth(stored)
  }
  document.addEventListener('pointerdown', handleOutsideMoreClick)
  window.__MOKUP_PLAYGROUND__ = {
    reloadRoutes: () => {
      loadRoutes().catch(() => undefined)
    },
  }
  loadRoutes().catch(() => undefined)
})

onBeforeUnmount(() => {
  stopDrag()
  document.removeEventListener('pointerdown', handleOutsideMoreClick)
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
            <aside class="flex min-h-0 w-full max-w-none flex-col gap-3 overflow-hidden border-b p-3 border-pg-border lg:w-[var(--left-width)] lg:min-w-[240px] lg:max-w-[560px] lg:flex-none lg:border-b-0 lg:border-r">
              <div class="relative">
                <div class="flex items-end gap-2">
                  <PlaygroundFilters
                    v-model:search="search"
                    :base-path="basePath || '/'"
                    :show-base="false"
                    :compact="true"
                    class="flex-1"
                  />
                  <button
                    ref="moreButtonRef"
                    class="flex h-9 items-center gap-2 rounded-full border px-3 text-[0.55rem] uppercase tracking-[0.25em] transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-soft"
                    type="button"
                    :aria-expanded="showMore"
                    aria-haspopup="true"
                    aria-controls="playground-more-panel"
                    @click="toggleMore"
                  >
                    <span class="i-[carbon--settings-adjust] h-3.5 w-3.5" aria-hidden="true" />
                    <span>{{ t('controls.more') }}</span>
                  </button>
                </div>
                <div
                  v-if="showMore"
                  id="playground-more-panel"
                  ref="morePanelRef"
                  class="absolute left-0 right-0 z-30 mt-2 rounded-2xl border p-3 shadow-xl border-pg-border bg-pg-surface-panel"
                >
                  <div class="grid gap-3">
                    <label class="flex flex-col gap-1 text-[0.55rem] uppercase tracking-[0.25em] text-pg-text-muted">
                      {{ t('filters.base') }}
                      <input
                        :value="basePath || '/'"
                        readonly
                        class="rounded-lg border px-2.5 py-1.5 text-[0.8rem] border-pg-border bg-pg-surface-strong text-pg-text"
                      >
                    </label>
                    <PlaygroundTabs :groups="groups" :active-group="activeGroup" @select="setActiveGroup" />
                    <TreeModeToggle :tree-mode="treeMode" @update:treeMode="setTreeMode" />
                  </div>
                </div>
              </div>

              <div class="flex-1 min-h-0 overflow-auto">
                <div v-if="error" class="rounded-2xl border px-4 py-3 text-sm border-pg-danger-border bg-pg-danger-bg text-pg-danger-text">
                  {{ error }}
                </div>
                <div v-else-if="loading" class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted">
                  {{ t('states.loadingRoutes') }}
                </div>
                <div v-else-if="!filtered.length" class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted">
                  {{ t('states.emptyRoutes') }}
                </div>
                <RouteTree
                  v-else
                  :rows="treeRows"
                  :workspace-root="workspaceRoot"
                  @toggle="toggleExpanded"
                  @select="handleSelectRow"
                />
              </div>
            </aside>

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
              <div class="flex flex-none flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-[0.55rem] uppercase tracking-[0.25em] shadow-sm border-pg-border bg-pg-surface-card text-pg-text-soft">
                <span class="flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.25em] border-pg-border bg-pg-surface-strong text-pg-text-soft">
                  <span class="i-[carbon--map] h-3.5 w-3.5" aria-hidden="true" />
                  <span>{{ t('header.routes', { count: routeCount }) }}</span>
                </span>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    class="flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.25em] transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-soft"
                    :title="t('header.languageToggle')"
                    @click="toggleLocale"
                  >
                    <span class="i-[carbon--language] h-3.5 w-3.5" aria-hidden="true" />
                    <span>{{ localeLabel }}</span>
                  </button>
                  <button
                    class="flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.25em] transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-soft"
                    :title="t('header.themeToggle')"
                    @click="cycleThemeMode"
                  >
                    <span :class="themeIcon" class="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{{ themeLabel }}</span>
                  </button>
                  <button
                    class="flex items-center gap-2 rounded-full border px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.25em] transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-soft"
                    @click="loadRoutes"
                  >
                    <span class="i-[carbon--rotate] h-3.5 w-3.5" aria-hidden="true" />
                    <span>{{ t('header.refresh') }}</span>
                  </button>
                </div>
              </div>

              <div class="mt-3 flex-1 min-h-0 overflow-auto">
                <RouteDetail
                  v-model:queryText="queryText"
                  v-model:headersText="headersText"
                  v-model:bodyText="bodyText"
                  :selected="selected"
                  :response-text="responseText"
                  :response-status="responseStatus"
                  :response-time="responseTime"
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
