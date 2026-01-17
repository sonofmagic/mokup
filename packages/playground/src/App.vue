<script setup lang="ts">
import type { PlaygroundLocale } from './i18n'
import type { TreeRow } from './types'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PlaygroundFilters from './components/PlaygroundFilters.vue'
import PlaygroundHeader from './components/PlaygroundHeader.vue'
import PlaygroundTabs from './components/PlaygroundTabs.vue'
import RouteDetail from './components/RouteDetail.vue'
import RouteTree from './components/RouteTree.vue'
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

const { treeMode, treeRows, toggleExpanded, setTreeMode } = useRouteTree({
  routes: filtered,
  selectedKey,
  searchTerm,
  getRouteKey: routeKey,
})

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

onMounted(() => {
  setBasePath(window.location.pathname)
  window.__MOKUP_PLAYGROUND__ = {
    reloadRoutes: () => {
      loadRoutes().catch(() => undefined)
    },
  }
  loadRoutes().catch(() => undefined)
})
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,196,150,0.35),_transparent_55%),radial-gradient(circle_at_80%_20%,_rgba(120,220,205,0.25),_transparent_50%),radial-gradient(circle_at_10%_80%,_rgba(250,220,180,0.25),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(52,96,140,0.35),_transparent_55%),radial-gradient(circle_at_80%_20%,_rgba(26,115,104,0.25),_transparent_50%),radial-gradient(circle_at_10%_80%,_rgba(120,80,40,0.3),_transparent_55%)]">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10">
      <PlaygroundHeader
        :route-count="routeCount"
        :theme-mode="themeMode"
        :effective-theme="effectiveTheme"
        :locale="locale"
        @toggle-theme="cycleThemeMode"
        @toggle-locale="toggleLocale"
        @refresh="loadRoutes"
      />

      <PlaygroundFilters v-model:search="search" :base-path="basePath || '/'" />

      <PlaygroundTabs :groups="groups" :active-group="activeGroup" @select="setActiveGroup" />

      <main class="grid gap-6 lg:grid-cols-[minmax(260px,_1fr)_minmax(320px,_1.4fr)]">
        <aside class="flex flex-col gap-4">
          <div v-if="error" class="rounded-2xl border border-rose-500/40 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 dark:border-rose-300/40 dark:bg-rose-950/40 dark:text-rose-100/80">
            {{ error }}
          </div>
          <div v-else-if="loading" class="rounded-2xl border border-amber-900/10 bg-white/60 px-4 py-6 text-sm text-amber-700 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-100/70">
            {{ t('states.loadingRoutes') }}
          </div>
          <div v-else-if="!filtered.length" class="rounded-2xl border border-amber-900/10 bg-white/60 px-4 py-6 text-sm text-amber-700 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-100/70">
            {{ t('states.emptyRoutes') }}
          </div>
          <RouteTree
            v-else
            :rows="treeRows"
            :tree-mode="treeMode"
            @update:treeMode="setTreeMode"
            @toggle="toggleExpanded"
            @select="handleSelectRow"
          />
        </aside>

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
      </main>
    </div>
  </div>
</template>
