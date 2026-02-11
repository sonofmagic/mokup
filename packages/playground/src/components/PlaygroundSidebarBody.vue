<script setup lang="ts">
import type {
  PlaygroundConfigFile,
  PlaygroundDisabledRoute,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
  TreeRow,
} from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { openInEditor, resolveEditorUrl } from '../utils/editor'
import { buildHighlightParts, extractSearchValues } from '../utils/search'
import RouteTree from './RouteTree.vue'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  search: string
  routeMode: 'active' | 'disabled' | 'ignored'
  enabledMode: 'api' | 'config'
  disabledMode: 'api' | 'config'
  selectedConfig?: PlaygroundConfigFile | null
  selectedDisabled?: PlaygroundDisabledRoute | null
  selectedIgnored?: PlaygroundIgnoredRoute | null
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
  (event: 'toggle', id: string): void
  (event: 'select-route', route: PlaygroundRoute): void
  (event: 'select-disabled-route', route: PlaygroundDisabledRoute): void
  (event: 'select-ignored-route', route: PlaygroundIgnoredRoute): void
  (event: 'select-config', entry: PlaygroundConfigFile): void
}>()

const { t } = useI18n()

const selectedRowClass = 'relative bg-pg-accent/12 text-pg-text-strong font-semibold shadow-[inset_4px_0_0_0_var(--color-pg-accent)]'
const highlightTokens = computed(() => extractSearchValues(props.search))

const routeTreeProps = computed(() => {
  const base: {
    rows: TreeRow[]
    workspaceRoot?: string
    getRouteCount?: (route: PlaygroundRoute) => number
  } = {
    rows: props.treeRows,
  }
  if (props.workspaceRoot && props.workspaceRoot.trim()) {
    base.workspaceRoot = props.workspaceRoot
  }
  if (props.getRouteCount) {
    base.getRouteCount = props.getRouteCount
  }
  return base
})

function reasonLabel(reason?: string) {
  const key = reason ?? 'unknown'
  return t(`disabled.reason.${key}`)
}

function ignoredReasonLabel(reason?: string) {
  const key = reason ?? 'unknown'
  return t(`ignored.reason.${key}`)
}

function formatRoutePath(value?: string) {
  return value ? value.toLowerCase() : ''
}

function formatConfigLabel(value: string) {
  return value.toLowerCase()
}

function highlightParts(text: string) {
  return buildHighlightParts(text, highlightTokens.value)
}

function resolveRouteLabel(route: PlaygroundDisabledRoute) {
  if (route.method && route.url) {
    return `${route.method} ${formatRoutePath(route.url)}`
  }
  return formatRoutePath(route.url) || route.file
}

function resolveEditorUrlForFile(file: string) {
  return resolveEditorUrl(file, props.workspaceRoot)
}

function openInEditorForFile(file: string) {
  openInEditor(file, props.workspaceRoot)
}

function handleSelectRow(row: TreeRow) {
  if (row.route) {
    emit('select-route', row.route)
  }
}

function isSelectedConfig(entry: PlaygroundConfigFile) {
  return props.selectedConfig?.file === entry.file
}

function resolveDisabledKey(route: PlaygroundDisabledRoute | null | undefined) {
  if (!route) {
    return ''
  }
  const method = (route.method ?? '').toUpperCase()
  const url = route.url ?? ''
  return `${route.file}|${route.reason}|${method}|${url}`
}

function isSelectedDisabled(route: PlaygroundDisabledRoute) {
  const selectedKey = resolveDisabledKey(props.selectedDisabled)
  if (!selectedKey) {
    return false
  }
  return resolveDisabledKey(route) === selectedKey
}

function isSelectedIgnored(route: PlaygroundIgnoredRoute) {
  return props.selectedIgnored?.file === route.file
    && props.selectedIgnored?.reason === route.reason
}
</script>

<template>
  <div class="flex-1 min-h-0 overflow-auto">
    <div v-if="props.error" class="rounded border px-4 py-3 text-sm border-pg-danger-border bg-pg-danger-bg text-pg-danger-text">
      {{ props.error }}
    </div>
    <div v-else-if="props.loading && !props.hasCachedData" class="rounded border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted">
      {{ t('states.loadingRoutes') }}
    </div>
    <template v-else>
      <div
        v-if="props.loading && props.hasCachedData"
        class="mb-2 inline-flex items-center gap-2 rounded border px-2.5 py-1 text-xs border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        <span class="i-[carbon--renew] h-3 w-3 animate-spin" aria-hidden="true" />
        <span>{{ t('states.loadingRoutes') }}</span>
      </div>
      <div
        v-if="props.routeMode === 'disabled' && props.disabledMode === 'api' && !props.disabledFiltered.length"
        class="rounded border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyDisabledRoutes') }}
      </div>
      <div
        v-else-if="props.routeMode === 'ignored' && !props.ignoredFiltered.length"
        class="rounded border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyIgnoredRoutes') }}
      </div>
      <div
        v-else-if="props.routeMode === 'active' && props.enabledMode === 'api' && !props.filtered.length"
        class="rounded border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyRoutes') }}
      </div>
      <div
        v-else-if="props.routeMode === 'active' && props.enabledMode === 'config' && !props.configFiltered.length"
        class="rounded border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyConfigFiles') }}
      </div>
      <div v-else-if="props.routeMode === 'disabled' && props.disabledMode === 'api'" class="flex flex-col gap-0.5">
        <button
          v-for="route in props.disabledFiltered"
          :key="`${route.file}-${route.reason}-${route.method ?? ''}-${route.url ?? ''}`"
          class="rounded border px-3 py-1 text-left text-xs transition border-pg-border bg-pg-surface-soft text-pg-text-soft hover:bg-pg-hover-strong hover:text-pg-text"
          :class="isSelectedDisabled(route) ? selectedRowClass : ''"
          type="button"
          @click="emit('select-disabled-route', route)"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[0.78rem] font-medium text-pg-text-strong">
                <template v-for="(part, index) in highlightParts(resolveRouteLabel(route))" :key="`${route.file}-label-${index}`">
                  <span :class="part.highlight ? 'pg-highlight' : ''">{{ part.text }}</span>
                </template>
              </span>
              <span
                v-if="route.method && route.url"
                class="text-[0.7rem] text-pg-text-muted"
              >
                <template v-for="(part, index) in highlightParts(route.file)" :key="`${route.file}-file-${index}`">
                  <span :class="part.highlight ? 'pg-highlight' : ''">{{ part.text }}</span>
                </template>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="isSelectedDisabled(route)"
                class="flex h-6 w-6 items-center justify-center rounded border border-pg-accent/40 bg-pg-accent/10 text-pg-accent"
                aria-hidden="true"
              >
                <span class="i-[carbon--checkmark] h-3.5 w-3.5" />
              </span>
              <UiPill tone="card" size="sm" :caps="false" tracking="none">
                {{ reasonLabel(route.reason) }}
              </UiPill>
              <button
                v-if="resolveEditorUrlForFile(route.file)"
                class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                type="button"
                :aria-label="`Open ${route.file} in VS Code`"
                :title="t('detail.openInVscode')"
                @click.stop="openInEditorForFile(route.file)"
              >
                <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </button>
      </div>
      <div
        v-else-if="props.routeMode === 'disabled' && props.disabledMode === 'config' && !props.disabledConfigFiltered.length"
        class="rounded border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyDisabledConfigFiles') }}
      </div>
      <div v-else-if="props.routeMode === 'disabled' && props.disabledMode === 'config'" class="flex flex-col gap-0.5">
        <button
          v-for="entry in props.disabledConfigFiltered"
          :key="entry.file"
          class="rounded border px-3 py-1 text-left text-xs transition border-pg-border bg-pg-surface-soft text-pg-text-soft hover:bg-pg-hover-strong hover:text-pg-text"
          :class="isSelectedConfig(entry) ? selectedRowClass : ''"
          type="button"
          @click="emit('select-config', entry)"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[0.75rem] font-medium text-pg-text-strong">
                <template v-for="(part, index) in highlightParts(formatConfigLabel(entry.file))" :key="`${entry.file}-disabled-${index}`">
                  <span :class="part.highlight ? 'pg-highlight' : ''">{{ part.text }}</span>
                </template>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="isSelectedConfig(entry)"
                class="flex h-6 w-6 items-center justify-center rounded border border-pg-accent/40 bg-pg-accent/10 text-pg-accent"
                aria-hidden="true"
              >
                <span class="i-[carbon--checkmark] h-3.5 w-3.5" />
              </span>
              <UiPill tone="card" size="sm" :caps="false" tracking="none">
                {{ t('enabled.configLabel') }}
              </UiPill>
              <button
                v-if="resolveEditorUrlForFile(entry.file)"
                class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                type="button"
                :aria-label="`Open ${entry.file} in VS Code`"
                :title="t('detail.openInVscode')"
                @click.stop="openInEditorForFile(entry.file)"
              >
                <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </button>
      </div>
      <div v-else-if="props.routeMode === 'ignored'" class="flex flex-col gap-0.5">
        <button
          v-for="route in props.ignoredFiltered"
          :key="`${route.file}-${route.reason}`"
          class="rounded border px-3 py-1 text-left text-xs transition border-pg-border bg-pg-surface-soft text-pg-text-soft hover:bg-pg-hover-strong hover:text-pg-text"
          :class="isSelectedIgnored(route) ? selectedRowClass : ''"
          type="button"
          @click="emit('select-ignored-route', route)"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[0.75rem] font-medium text-pg-text-strong">
                <template v-for="(part, index) in highlightParts(route.file)" :key="`${route.file}-ignored-${index}`">
                  <span :class="part.highlight ? 'pg-highlight' : ''">{{ part.text }}</span>
                </template>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="isSelectedIgnored(route)"
                class="flex h-6 w-6 items-center justify-center rounded border border-pg-accent/40 bg-pg-accent/10 text-pg-accent"
                aria-hidden="true"
              >
                <span class="i-[carbon--checkmark] h-3.5 w-3.5" />
              </span>
              <UiPill tone="card" size="sm" :caps="false" tracking="none">
                {{ ignoredReasonLabel(route.reason) }}
              </UiPill>
              <button
                v-if="resolveEditorUrlForFile(route.file)"
                class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                type="button"
                :aria-label="`Open ${route.file} in VS Code`"
                :title="t('detail.openInVscode')"
                @click.stop="openInEditorForFile(route.file)"
              >
                <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </button>
      </div>
      <div v-else-if="props.routeMode === 'active' && props.enabledMode === 'config'" class="flex flex-col gap-0.5">
        <button
          v-for="entry in props.configFiltered"
          :key="entry.file"
          class="rounded border px-3 py-1 text-left text-xs transition border-pg-border bg-pg-surface-soft text-pg-text-soft hover:bg-pg-hover-strong hover:text-pg-text"
          :class="isSelectedConfig(entry) ? selectedRowClass : ''"
          type="button"
          @click="emit('select-config', entry)"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[0.75rem] font-medium text-pg-text-strong">
                <template v-for="(part, index) in highlightParts(formatConfigLabel(entry.file))" :key="`${entry.file}-config-${index}`">
                  <span :class="part.highlight ? 'pg-highlight' : ''">{{ part.text }}</span>
                </template>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="isSelectedConfig(entry)"
                class="flex h-6 w-6 items-center justify-center rounded border border-pg-accent/40 bg-pg-accent/10 text-pg-accent"
                aria-hidden="true"
              >
                <span class="i-[carbon--checkmark] h-3.5 w-3.5" />
              </span>
              <UiPill tone="card" size="sm" :caps="false" tracking="none">
                {{ t('enabled.configLabel') }}
              </UiPill>
              <button
                v-if="resolveEditorUrlForFile(entry.file)"
                class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                type="button"
                :aria-label="`Open ${entry.file} in VS Code`"
                :title="t('detail.openInVscode')"
                @click.stop="openInEditorForFile(entry.file)"
              >
                <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </button>
      </div>
      <RouteTree
        v-else
        v-bind="routeTreeProps"
        :highlight-tokens="highlightTokens"
        @toggle="emit('toggle', $event)"
        @select="handleSelectRow"
      />
    </template>
  </div>
</template>
