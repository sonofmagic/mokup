<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type {
  PlaygroundConfigFile,
  PlaygroundDisabledRoute,
  PlaygroundGroup,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
  TreeMode,
  TreeRow,
} from '../types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toPosixPath } from '../utils/path'
import PlaygroundFilters from './PlaygroundFilters.vue'
import PlaygroundTabs from './PlaygroundTabs.vue'
import RouteTree from './RouteTree.vue'
import TreeModeToggle from './TreeModeToggle.vue'
import UiChipButton from './ui/UiChipButton.vue'
import UiField from './ui/UiField.vue'
import UiPill from './ui/UiPill.vue'
import UiTextInput from './ui/UiTextInput.vue'

const props = defineProps<{
  search: string
  basePath?: string
  groups: PlaygroundGroup[]
  activeGroup: string
  treeMode: TreeMode
  routeMode: 'active' | 'disabled' | 'ignored'
  enabledMode: 'api' | 'config'
  disabledMode: 'api' | 'config'
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
}>()

const { t } = useI18n()

const searchModel = computed({
  get: () => props.search,
  set: value => emit('update:search', value),
})
const resolvedBasePath = computed(() => props.basePath || '/')
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

const showMore = ref(false)
const moreButtonRef = ref<ComponentPublicInstance | null>(null)
const morePanelRef = ref<HTMLDivElement | null>(null)

function toggleMore() {
  showMore.value = !showMore.value
}

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

function hasWorkspaceRoot() {
  return (props.workspaceRoot ?? '').trim().length > 0
}

function isAbsolutePath(value: string) {
  return value.startsWith('/') || /^[a-z]:\//i.test(value)
}

function resolveEditorPath(file: string) {
  if (!hasWorkspaceRoot()) {
    return null
  }
  const normalizedFile = toPosixPath(file || '').trim()
  if (!normalizedFile) {
    return null
  }
  if (isAbsolutePath(normalizedFile)) {
    return normalizedFile
  }
  const normalizedRoot = toPosixPath((props.workspaceRoot ?? '').trim()).replace(/\/$/, '')
  if (!normalizedRoot) {
    return null
  }
  const relative = normalizedFile.replace(/^\/+/, '')
  return `${normalizedRoot}/${relative}`
}

function openInEditor(file: string) {
  const filePath = resolveEditorPath(file)
  if (!filePath) {
    return
  }
  const target = `vscode://file/${encodeURI(filePath)}`
  window.location.href = target
}

function handleSelectRow(row: TreeRow) {
  if (row.route) {
    emit('select-route', row.route)
  }
}

function handleOutsideMoreClick(event: PointerEvent) {
  if (!showMore.value) {
    return
  }
  const target = event.target as Node | null
  if (!target) {
    return
  }
  const buttonEl = moreButtonRef.value?.$el as HTMLElement | null | undefined
  if (morePanelRef.value?.contains(target) || buttonEl?.contains(target)) {
    return
  }
  showMore.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsideMoreClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsideMoreClick)
})
</script>

<template>
  <aside class="flex min-h-0 w-full max-w-none flex-col gap-3 overflow-hidden border-b p-3 border-pg-border lg:w-[var(--left-width)] lg:min-w-[240px] lg:max-w-[560px] lg:flex-none lg:border-b-0 lg:border-r">
    <div class="relative">
      <div class="flex items-end gap-2">
        <PlaygroundFilters
          v-model:search="searchModel"
          :base-path="resolvedBasePath"
          :show-base="false"
          :compact="true"
          class="flex-1"
        />
        <UiChipButton
          ref="moreButtonRef"
          size="sm"
          class="h-9"
          :aria-expanded="showMore"
          aria-haspopup="true"
          aria-controls="playground-more-panel"
          @click="toggleMore"
        >
          <span class="i-[carbon--settings-adjust] h-3.5 w-3.5" aria-hidden="true" />
          <span>{{ t('controls.more') }}</span>
        </UiChipButton>
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-2">
        <UiChipButton
          size="md"
          :active="props.routeMode === 'active'"
          @click="emit('set-route-mode', 'active')"
        >
          {{ t('disabled.active', { count: props.activeTotal }) }}
        </UiChipButton>
        <UiChipButton
          size="md"
          :active="props.routeMode === 'disabled'"
          @click="emit('set-route-mode', 'disabled')"
        >
          {{ t('disabled.disabled', { count: props.disabledTotal }) }}
        </UiChipButton>
        <UiChipButton
          size="md"
          :active="props.routeMode === 'ignored'"
          @click="emit('set-route-mode', 'ignored')"
        >
          {{ t('disabled.ignored', { count: props.ignoredTotal }) }}
        </UiChipButton>
      </div>
      <div
        v-if="props.routeMode === 'active'"
        class="mt-2 flex flex-wrap items-center gap-2"
      >
        <UiChipButton
          size="sm"
          :active="props.enabledMode === 'api'"
          @click="emit('set-enabled-mode', 'api')"
        >
          {{ t('enabled.api', { count: props.apiTotal }) }}
        </UiChipButton>
        <UiChipButton
          size="sm"
          :active="props.enabledMode === 'config'"
          @click="emit('set-enabled-mode', 'config')"
        >
          {{ t('enabled.config', { count: props.configTotal }) }}
        </UiChipButton>
      </div>
      <div
        v-else-if="props.routeMode === 'disabled'"
        class="mt-2 flex flex-wrap items-center gap-2"
      >
        <UiChipButton
          size="sm"
          :active="props.disabledMode === 'api'"
          @click="emit('set-disabled-mode', 'api')"
        >
          {{ t('enabled.api', { count: props.disabledApiTotal }) }}
        </UiChipButton>
        <UiChipButton
          size="sm"
          :active="props.disabledMode === 'config'"
          @click="emit('set-disabled-mode', 'config')"
        >
          {{ t('enabled.config', { count: props.disabledConfigTotal }) }}
        </UiChipButton>
      </div>
      <div
        v-if="showMore"
        id="playground-more-panel"
        ref="morePanelRef"
        class="absolute left-0 right-0 z-30 mt-2 rounded-2xl border p-3 shadow-xl border-pg-border bg-pg-surface-panel"
      >
        <div class="grid gap-3">
          <UiField :label="t('filters.base')" dense>
            <UiTextInput
              :value="resolvedBasePath"
              readonly
              dense
            />
          </UiField>
          <PlaygroundTabs :groups="props.groups" :active-group="props.activeGroup" @select="emit('select-group', $event)" />
          <TreeModeToggle :tree-mode="props.treeMode" @update:treeMode="emit('update:treeMode', $event)" />
        </div>
      </div>
    </div>

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
                  v-if="resolveEditorPath(route.file)"
                  class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                  type="button"
                  :aria-label="`Open ${route.file} in VS Code`"
                  :title="t('detail.openInVscode')"
                  @click="openInEditor(route.file)"
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
          <div
            v-for="entry in props.disabledConfigFiltered"
            :key="entry.file"
            class="rounded-2xl border px-4 py-3 text-xs border-pg-border bg-pg-surface-soft text-pg-text-soft"
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
                  v-if="resolveEditorPath(entry.file)"
                  class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                  type="button"
                  :aria-label="`Open ${entry.file} in VS Code`"
                  :title="t('detail.openInVscode')"
                  @click="openInEditor(entry.file)"
                >
                  <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
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
                  v-if="resolveEditorPath(route.file)"
                  class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                  type="button"
                  :aria-label="`Open ${route.file} in VS Code`"
                  :title="t('detail.openInVscode')"
                  @click="openInEditor(route.file)"
                >
                  <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="props.routeMode === 'active' && props.enabledMode === 'config'" class="flex flex-col gap-2">
          <div
            v-for="entry in props.configFiltered"
            :key="entry.file"
            class="rounded-2xl border px-4 py-3 text-xs border-pg-border bg-pg-surface-soft text-pg-text-soft"
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
                  v-if="resolveEditorPath(entry.file)"
                  class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                  type="button"
                  :aria-label="`Open ${entry.file} in VS Code`"
                  :title="t('detail.openInVscode')"
                  @click="openInEditor(entry.file)"
                >
                  <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <RouteTree
          v-else
          v-bind="routeTreeProps"
          @toggle="emit('toggle', $event)"
          @select="handleSelectRow"
        />
      </template>
    </div>
  </aside>
</template>
