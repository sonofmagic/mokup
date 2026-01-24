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
import PlaygroundSidebarBody from './PlaygroundSidebarBody.vue'
import PlaygroundSidebarHeader from './PlaygroundSidebarHeader.vue'

const props = defineProps<{
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
  (event: 'toggle', id: string): void
  (event: 'select-route', route: PlaygroundRoute): void
  (event: 'select-disabled-route', route: PlaygroundDisabledRoute): void
  (event: 'select-ignored-route', route: PlaygroundIgnoredRoute): void
  (event: 'select-config', entry: PlaygroundConfigFile): void
}>()
</script>

<template>
  <aside class="flex min-h-0 w-full max-w-none flex-col gap-3 overflow-hidden border-b p-3 border-pg-border lg:w-[var(--left-width)] lg:min-w-[240px] lg:max-w-[560px] lg:flex-none lg:border-b-0 lg:border-r">
    <PlaygroundSidebarHeader
      :search="props.search"
      :base-path="props.basePath"
      :groups="props.groups"
      :active-group="props.activeGroup"
      :tree-mode="props.treeMode"
      :route-mode="props.routeMode"
      :enabled-mode="props.enabledMode"
      :disabled-mode="props.disabledMode"
      :active-total="props.activeTotal"
      :api-total="props.apiTotal"
      :disabled-total="props.disabledTotal"
      :ignored-total="props.ignoredTotal"
      :config-total="props.configTotal"
      :disabled-api-total="props.disabledApiTotal"
      :disabled-config-total="props.disabledConfigTotal"
      @update:search="emit('update:search', $event)"
      @select-group="emit('select-group', $event)"
      @set-route-mode="emit('set-route-mode', $event)"
      @set-enabled-mode="emit('set-enabled-mode', $event)"
      @set-disabled-mode="emit('set-disabled-mode', $event)"
      @update:treeMode="emit('update:treeMode', $event)"
    />
    <PlaygroundSidebarBody
      :route-mode="props.routeMode"
      :enabled-mode="props.enabledMode"
      :disabled-mode="props.disabledMode"
      :selected-config="props.selectedConfig"
      :selected-disabled="props.selectedDisabled"
      :selected-ignored="props.selectedIgnored"
      :error="props.error"
      :loading="props.loading"
      :filtered="props.filtered"
      :disabled-filtered="props.disabledFiltered"
      :ignored-filtered="props.ignoredFiltered"
      :config-filtered="props.configFiltered"
      :disabled-config-filtered="props.disabledConfigFiltered"
      :tree-rows="props.treeRows"
      :workspace-root="props.workspaceRoot"
      :get-route-count="props.getRouteCount"
      @toggle="emit('toggle', $event)"
      @select-route="emit('select-route', $event)"
      @select-disabled-route="emit('select-disabled-route', $event)"
      @select-ignored-route="emit('select-ignored-route', $event)"
      @select-config="emit('select-config', $event)"
    />
  </aside>
</template>
