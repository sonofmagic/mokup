<script setup lang="ts">
import type {
  PlaygroundConfigFile,
  PlaygroundDisabledRoute,
  PlaygroundGroup,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
  TreeMode,
  TreeRow,
} from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PlaygroundSidebarBody from './PlaygroundSidebarBody.vue'
import PlaygroundSidebarHeader from './PlaygroundSidebarHeader.vue'

const props = defineProps<{
  collapsed: boolean
  search: string
  basePath?: string
  groups: PlaygroundGroup[]
  activeGroup: string
  treeMode: TreeMode
  routeMode: 'active' | 'disabled' | 'ignored'
  enabledMode: 'api' | 'config'
  disabledMode: 'api' | 'config'
  selectedConfig?: PlaygroundConfigFile | null
  selectedDisabled?: PlaygroundDisabledRoute | null
  selectedIgnored?: PlaygroundIgnoredRoute | null
  activeTotal: number
  apiTotal: number
  disabledTotal: number
  ignoredTotal: number
  configTotal: number
  disabledApiTotal: number
  disabledConfigTotal: number
  error?: string
  loading: boolean
  hasCachedData: boolean
  filtered: PlaygroundRoute[]
  disabledFiltered: PlaygroundDisabledRoute[]
  ignoredFiltered: PlaygroundIgnoredRoute[]
  configFiltered: PlaygroundConfigFile[]
  disabledConfigFiltered: PlaygroundConfigFile[]
  treeRows: TreeRow[]
  workspaceRoot?: string
  getRouteCount?: (route: PlaygroundRoute) => number
}>()

const emit = defineEmits<{
  (event: 'update:search', value: string): void
  (event: 'select-group', key: string): void
  (event: 'set-route-mode', mode: 'active' | 'disabled' | 'ignored'): void
  (event: 'set-enabled-mode', mode: 'api' | 'config'): void
  (event: 'set-disabled-mode', mode: 'api' | 'config'): void
  (event: 'update:treeMode', mode: TreeMode): void
  (event: 'toggle-collapse'): void
  (event: 'toggle', id: string): void
  (event: 'select-route', route: PlaygroundRoute): void
  (event: 'select-disabled-route', route: PlaygroundDisabledRoute): void
  (event: 'select-ignored-route', route: PlaygroundIgnoredRoute): void
  (event: 'select-config', entry: PlaygroundConfigFile): void
}>()

const { t } = useI18n()

const sidebarClass = computed(() => {
  const base = 'flex min-h-0 w-full max-w-none flex-col overflow-hidden border-b border-pg-border bg-pg-surface-soft lg:flex-none lg:border-b-0 lg:border-r'
  if (props.collapsed) {
    return `${base} p-1 lg:w-[72px] lg:min-w-[72px] lg:max-w-[72px]`
  }
  return `${base} gap-1 p-2 lg:w-[var(--left-width)] lg:min-w-[240px] lg:max-w-[560px]`
})

const collapsedGroupLabel = computed(() => {
  const label = (props.activeGroup || 'all').toUpperCase()
  return label.length > 6 ? `${label.slice(0, 6)}…` : label
})

const hasSearch = computed(() => props.search.trim().length > 0)
const isApiMode = computed(() => (props.routeMode === 'disabled' ? props.disabledMode : props.enabledMode) === 'api')
const isConfigMode = computed(() => (props.routeMode === 'disabled' ? props.disabledMode : props.enabledMode) === 'config')

const sidebarHeaderProps = computed(() => {
  const base = {
    search: props.search,
    groups: props.groups,
    activeGroup: props.activeGroup,
    treeMode: props.treeMode,
    routeMode: props.routeMode,
    enabledMode: props.enabledMode,
    disabledMode: props.disabledMode,
    activeTotal: props.activeTotal,
    apiTotal: props.apiTotal,
    disabledTotal: props.disabledTotal,
    ignoredTotal: props.ignoredTotal,
    configTotal: props.configTotal,
    disabledApiTotal: props.disabledApiTotal,
    disabledConfigTotal: props.disabledConfigTotal,
  }
  if (props.basePath !== undefined) {
    return { ...base, basePath: props.basePath }
  }
  return base
})

const sidebarBodyProps = computed(() => {
  const base = {
    search: props.search,
    routeMode: props.routeMode,
    enabledMode: props.enabledMode,
    disabledMode: props.disabledMode,
    loading: props.loading,
    hasCachedData: props.hasCachedData,
    filtered: props.filtered,
    disabledFiltered: props.disabledFiltered,
    ignoredFiltered: props.ignoredFiltered,
    configFiltered: props.configFiltered,
    disabledConfigFiltered: props.disabledConfigFiltered,
    treeRows: props.treeRows,
  }
  const next: typeof base & {
    selectedConfig?: PlaygroundConfigFile | null
    selectedDisabled?: PlaygroundDisabledRoute | null
    selectedIgnored?: PlaygroundIgnoredRoute | null
    error?: string
    workspaceRoot?: string
    getRouteCount?: (route: PlaygroundRoute) => number
  } = { ...base }
  if (props.selectedConfig !== undefined) {
    next.selectedConfig = props.selectedConfig
  }
  if (props.selectedDisabled !== undefined) {
    next.selectedDisabled = props.selectedDisabled
  }
  if (props.selectedIgnored !== undefined) {
    next.selectedIgnored = props.selectedIgnored
  }
  if (props.error !== undefined) {
    next.error = props.error
  }
  if (props.workspaceRoot !== undefined) {
    next.workspaceRoot = props.workspaceRoot
  }
  if (props.getRouteCount) {
    next.getRouteCount = props.getRouteCount
  }
  return next
})

function handleSubMode(mode: 'api' | 'config') {
  if (props.routeMode === 'disabled') {
    emit('set-disabled-mode', mode)
    return
  }
  emit('set-enabled-mode', mode)
}
</script>

<template>
  <aside :class="sidebarClass">
    <div v-if="!props.collapsed" class="flex min-h-0 flex-1 flex-col gap-1">
      <PlaygroundSidebarHeader
        v-bind="sidebarHeaderProps"
        @update:search="emit('update:search', $event)"
        @select-group="emit('select-group', $event)"
        @set-route-mode="emit('set-route-mode', $event)"
        @set-enabled-mode="emit('set-enabled-mode', $event)"
        @set-disabled-mode="emit('set-disabled-mode', $event)"
        @update:treeMode="emit('update:treeMode', $event)"
      >
        <template #actions>
          <button
            class="flex h-[34px] w-[34px] items-center justify-center rounded border transition border-pg-border bg-pg-surface-strong text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
            type="button"
            :aria-label="t('controls.collapseSidebar')"
            :title="t('controls.collapseSidebar')"
            @click="emit('toggle-collapse')"
          >
            <span class="i-[carbon--chevron-left] h-4 w-4" aria-hidden="true" />
          </button>
        </template>
      </PlaygroundSidebarHeader>
      <PlaygroundSidebarBody
        v-bind="sidebarBodyProps"
        @toggle="emit('toggle', $event)"
        @select-route="emit('select-route', $event)"
        @select-disabled-route="emit('select-disabled-route', $event)"
        @select-ignored-route="emit('select-ignored-route', $event)"
        @select-config="emit('select-config', $event)"
      />
    </div>
    <div v-else class="flex min-h-0 flex-1 flex-col items-center gap-1 py-1">
      <button
        class="flex h-7 w-7 items-center justify-center rounded border transition border-pg-border bg-pg-surface-strong text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
        type="button"
        :aria-label="t('controls.expandSidebar')"
        :title="t('controls.expandSidebar')"
        @click="emit('toggle-collapse')"
      >
        <span class="i-[carbon--chevron-right] h-4 w-4" aria-hidden="true" />
      </button>
      <div class="flex flex-col items-center gap-1">
        <button
          class="flex h-8 w-8 items-center justify-center rounded border transition"
          :class="props.routeMode === 'active'
            ? 'border-pg-accent bg-pg-accent/15 text-pg-accent'
            : 'border-pg-border bg-pg-surface-strong text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft'"
          type="button"
          :title="t('disabled.active', { count: props.activeTotal })"
          @click="emit('set-route-mode', 'active')"
        >
          <span class="i-[carbon--checkmark-filled] h-4 w-4" aria-hidden="true" />
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded border transition"
          :class="props.routeMode === 'disabled'
            ? 'border-pg-accent bg-pg-accent/15 text-pg-accent'
            : 'border-pg-border bg-pg-surface-strong text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft'"
          type="button"
          :title="t('disabled.disabled', { count: props.disabledTotal })"
          @click="emit('set-route-mode', 'disabled')"
        >
          <span class="i-[carbon--close-filled] h-4 w-4" aria-hidden="true" />
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded border transition"
          :class="props.routeMode === 'ignored'
            ? 'border-pg-accent bg-pg-accent/15 text-pg-accent'
            : 'border-pg-border bg-pg-surface-strong text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft'"
          type="button"
          :title="t('disabled.ignored', { count: props.ignoredTotal })"
          @click="emit('set-route-mode', 'ignored')"
        >
          <span class="i-[carbon--view-off] h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div class="h-px w-8 bg-pg-border" />

      <div
        v-if="props.routeMode !== 'ignored'"
        class="flex flex-col items-center gap-1"
      >
        <button
          class="flex h-8 w-8 items-center justify-center rounded border transition"
          :class="isApiMode
            ? 'border-pg-accent bg-pg-accent/15 text-pg-accent'
            : 'border-pg-border bg-pg-surface-strong text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft'"
          type="button"
          :title="props.routeMode === 'disabled'
            ? t('enabled.api', { count: props.disabledApiTotal })
            : t('enabled.api', { count: props.apiTotal })"
          @click="handleSubMode('api')"
        >
          <span class="i-[carbon--api] h-4 w-4" aria-hidden="true" />
        </button>
        <button
          class="flex h-8 w-8 items-center justify-center rounded border transition"
          :class="isConfigMode
            ? 'border-pg-accent bg-pg-accent/15 text-pg-accent'
            : 'border-pg-border bg-pg-surface-strong text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft'"
          type="button"
          :title="props.routeMode === 'disabled'
            ? t('enabled.config', { count: props.disabledConfigTotal })
            : t('enabled.config', { count: props.configTotal })"
          @click="handleSubMode('config')"
        >
          <span class="i-[carbon--settings] h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div class="h-px w-8 bg-pg-border" />

      <div class="flex flex-col items-center gap-1 text-pg-text-muted">
        <span class="rounded border px-1.5 py-0.5 text-[0.6rem] tracking-[0.08em] border-pg-border bg-pg-surface-strong">
          {{ collapsedGroupLabel }}
        </span>
        <span v-if="hasSearch" class="flex h-7 w-7 items-center justify-center rounded border border-pg-accent/40 bg-pg-accent/10 text-pg-accent">
          <span class="i-[carbon--search] h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  </aside>
</template>
