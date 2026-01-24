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
import RouteTree from './RouteTree.vue'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  routeMode: 'active' | 'disabled' | 'ignored'
  enabledMode: 'api' | 'config'
  disabledMode: 'api' | 'config'
  selectedConfig?: PlaygroundConfigFile | null
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
  (event: 'toggle', id: string): void
  (event: 'select-route', route: PlaygroundRoute): void
  (event: 'select-config', entry: PlaygroundConfigFile): void
}>()

const { t } = useI18n()

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
</script>

<template>
  <div class="flex-1 min-h-0 overflow-auto">
    <div v-if="props.error" class="rounded-2xl border px-4 py-3 text-sm border-pg-danger-border bg-pg-danger-bg text-pg-danger-text">
      {{ props.error }}
    </div>
    <div v-else-if="props.loading" class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted">
      {{ t('states.loadingRoutes') }}
    </div>
    <template v-else>
      <div
        v-if="props.routeMode === 'disabled' && props.disabledMode === 'api' && !props.disabledFiltered.length"
        class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyDisabledRoutes') }}
      </div>
      <div
        v-else-if="props.routeMode === 'ignored' && !props.ignoredFiltered.length"
        class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyIgnoredRoutes') }}
      </div>
      <div
        v-else-if="props.routeMode === 'active' && props.enabledMode === 'api' && !props.filtered.length"
        class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyRoutes') }}
      </div>
      <div
        v-else-if="props.routeMode === 'active' && props.enabledMode === 'config' && !props.configFiltered.length"
        class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyConfigFiles') }}
      </div>
      <div v-else-if="props.routeMode === 'disabled' && props.disabledMode === 'api'" class="flex flex-col gap-2">
        <div
          v-for="route in props.disabledFiltered"
          :key="`${route.file}-${route.reason}-${route.method ?? ''}-${route.url ?? ''}`"
          class="rounded-2xl border px-4 py-3 text-xs border-pg-border bg-pg-surface-soft text-pg-text-soft"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[0.7rem] uppercase tracking-[0.18em] text-pg-text-muted">
                {{
                  route.method && route.url
                    ? `${route.method} ${formatRoutePath(route.url)}`
                    : formatRoutePath(route.url) || route.file
                }}
              </span>
              <span
                v-if="route.method && route.url"
                class="text-[0.75rem] text-pg-text-subtle"
              >
                {{ route.file }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <UiPill tone="strong" size="sm" tracking="tight">
                {{ reasonLabel(route.reason) }}
              </UiPill>
              <button
                v-if="resolveEditorUrlForFile(route.file)"
                class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                type="button"
                :aria-label="`Open ${route.file} in VS Code`"
                :title="t('detail.openInVscode')"
                @click="openInEditorForFile(route.file)"
              >
                <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else-if="props.routeMode === 'disabled' && props.disabledMode === 'config' && !props.disabledConfigFiltered.length"
        class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted"
      >
        {{ t('states.emptyDisabledConfigFiles') }}
      </div>
      <div v-else-if="props.routeMode === 'disabled' && props.disabledMode === 'config'" class="flex flex-col gap-2">
        <button
          v-for="entry in props.disabledConfigFiltered"
          :key="entry.file"
          class="rounded-2xl border px-4 py-3 text-left text-xs transition border-pg-border bg-pg-surface-soft text-pg-text-soft hover:bg-pg-hover-strong"
          :class="isSelectedConfig(entry) ? 'border-pg-accent bg-pg-accent/10 text-pg-text' : ''"
          type="button"
          @click="emit('select-config', entry)"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[0.7rem] uppercase tracking-[0.18em] text-pg-text-muted">
                {{ entry.file }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <UiPill tone="strong" size="sm" tracking="tight">
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
      <div v-else-if="props.routeMode === 'ignored'" class="flex flex-col gap-2">
        <div
          v-for="route in props.ignoredFiltered"
          :key="`${route.file}-${route.reason}`"
          class="rounded-2xl border px-4 py-3 text-xs border-pg-border bg-pg-surface-soft text-pg-text-soft"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[0.7rem] uppercase tracking-[0.18em] text-pg-text-muted">
                {{ route.file }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <UiPill tone="strong" size="sm" tracking="tight">
                {{ ignoredReasonLabel(route.reason) }}
              </UiPill>
              <button
                v-if="resolveEditorUrlForFile(route.file)"
                class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                type="button"
                :aria-label="`Open ${route.file} in VS Code`"
                :title="t('detail.openInVscode')"
                @click="openInEditorForFile(route.file)"
              >
                <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="props.routeMode === 'active' && props.enabledMode === 'config'" class="flex flex-col gap-2">
        <button
          v-for="entry in props.configFiltered"
          :key="entry.file"
          class="rounded-2xl border px-4 py-3 text-left text-xs transition border-pg-border bg-pg-surface-soft text-pg-text-soft hover:bg-pg-hover-strong"
          :class="isSelectedConfig(entry) ? 'border-pg-accent bg-pg-accent/10 text-pg-text' : ''"
          type="button"
          @click="emit('select-config', entry)"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-col gap-1">
              <span class="text-[0.7rem] tracking-[0.18em] text-pg-text-muted">
                {{ entry.file }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <UiPill tone="strong" size="sm" tracking="tight">
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
        @toggle="emit('toggle', $event)"
        @select="handleSelectRow"
      />
    </template>
  </div>
</template>
