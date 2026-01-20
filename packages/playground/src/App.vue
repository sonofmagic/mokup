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
  <div class="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(209,226,245,0.45),_transparent_55%),radial-gradient(circle_at_85%_20%,_rgba(200,230,222,0.35),_transparent_50%),radial-gradient(circle_at_12%_80%,_rgba(245,238,226,0.4),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(38,60,92,0.55),_transparent_55%),radial-gradient(circle_at_85%_20%,_rgba(24,78,96,0.4),_transparent_50%),radial-gradient(circle_at_12%_80%,_rgba(70,58,44,0.45),_transparent_55%)]">
    <div class="flex h-full w-full flex-col">
      <main class="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div class="flex flex-1 flex-col overflow-hidden bg-white/60 dark:bg-slate-950/70">
          <div
            class="flex min-h-0 flex-1 flex-col lg:flex-row"
            :class="isDragging ? 'select-none' : ''"
            :style="splitStyle"
          >
            <aside class="flex min-h-0 w-full max-w-none flex-col gap-3 overflow-hidden border-b border-slate-200/70 p-3 dark:border-slate-700/50 lg:w-[var(--left-width)] lg:min-w-[240px] lg:max-w-[560px] lg:flex-none lg:border-b-0 lg:border-r">
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
                    class="flex h-9 items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 text-[0.55rem] uppercase tracking-[0.25em] text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100"
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
                  class="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-xl dark:border-slate-700/50 dark:bg-slate-950/95"
                >
                  <div class="grid gap-3">
                    <label class="flex flex-col gap-1 text-[0.55rem] uppercase tracking-[0.25em] text-slate-600/70 dark:text-slate-200/60">
                      {{ t('filters.base') }}
                      <input
                        :value="basePath || '/'"
                        readonly
                        class="rounded-lg border border-slate-200/70 bg-white/80 px-2.5 py-1.5 text-[0.8rem] text-slate-800 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-50"
                      >
                    </label>
                    <PlaygroundTabs :groups="groups" :active-group="activeGroup" @select="setActiveGroup" />
                    <TreeModeToggle :tree-mode="treeMode" @update:treeMode="setTreeMode" />
                  </div>
                </div>
              </div>

              <div class="flex-1 min-h-0 overflow-auto">
                <div v-if="error" class="rounded-2xl border border-rose-500/40 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-300/40 dark:bg-rose-950/40 dark:text-rose-100/80">
                  {{ error }}
                </div>
                <div v-else-if="loading" class="rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-6 text-sm text-slate-500 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-200/70">
                  {{ t('states.loadingRoutes') }}
                </div>
                <div v-else-if="!filtered.length" class="rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-6 text-sm text-slate-500 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-200/70">
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
              <div class="h-full w-px bg-slate-200/70 dark:bg-slate-700/50" />
              <button
                class="group absolute flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:text-slate-600 dark:border-slate-700/50 dark:bg-slate-950/80 dark:text-slate-200/70"
                type="button"
                aria-label="Resize panels"
                @pointerdown="handleDragStart"
              >
                <span class="i-[carbon--drag-horizontal] h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <section class="flex min-h-0 flex-1 flex-col overflow-hidden p-4 lg:p-6">
              <div class="flex flex-none flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-3 py-2 text-[0.55rem] uppercase tracking-[0.25em] text-slate-700 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/70 dark:text-slate-100">
                <span class="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.25em] text-slate-700 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100">
                  <span class="i-[carbon--map] h-3.5 w-3.5" aria-hidden="true" />
                  <span>{{ t('header.routes', { count: routeCount }) }}</span>
                </span>
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    class="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.25em] text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100"
                    :title="t('header.languageToggle')"
                    @click="toggleLocale"
                  >
                    <span class="i-[carbon--language] h-3.5 w-3.5" aria-hidden="true" />
                    <span>{{ localeLabel }}</span>
                  </button>
                  <button
                    class="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.25em] text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100"
                    :title="t('header.themeToggle')"
                    @click="cycleThemeMode"
                  >
                    <span :class="themeIcon" class="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{{ themeLabel }}</span>
                  </button>
                  <button
                    class="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.25em] text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100"
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
