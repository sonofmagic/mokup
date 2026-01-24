<script setup lang="ts">
import type {
  PlaygroundConfigFile,
  PlaygroundConfigImpactRoute,
  PlaygroundDisabledRoute,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
  RouteParamField,
} from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ConfigDetail from './ConfigDetail.vue'
import RouteDetail from './RouteDetail.vue'
import RouteDetailInactive from './RouteDetailInactive.vue'

const props = defineProps<{
  selected: PlaygroundRoute | null
  selectedDisabled: PlaygroundDisabledRoute | null
  selectedIgnored: PlaygroundIgnoredRoute | null
  selectedConfig: PlaygroundConfigFile | null
  requestUrl: string
  workspaceRoot?: string
  routeParams: RouteParamField[]
  paramValues: Record<string, string>
  queryText: string
  headersText: string
  bodyText: string
  responseText: string
  responseStatus: string
  responseTime: string
  isSwRegistering: boolean
  routeMode: 'active' | 'disabled' | 'ignored'
  enabledMode: 'api' | 'config'
  disabledMode: 'api' | 'config'
  configImpactRoutes: PlaygroundConfigImpactRoute[]
  configStatusMap: Map<string, 'enabled' | 'disabled'>
}>()

const emit = defineEmits<{
  (event: 'update:queryText', value: string): void
  (event: 'update:headersText', value: string): void
  (event: 'update:bodyText', value: string): void
  (event: 'update:param-value', name: string, value: string): void
  (event: 'run'): void
}>()

const { t } = useI18n()

const isActiveMode = computed(() => props.routeMode === 'active' && props.enabledMode === 'api')
const isConfigMode = computed(() => !!props.selectedConfig)
const isDisabledApiMode = computed(() => props.routeMode === 'disabled' && props.disabledMode === 'api')
const isIgnoredMode = computed(() => props.routeMode === 'ignored')
const selectedConfigStatus = computed(() => {
  if (!props.selectedConfig) {
    return 'enabled'
  }
  return props.configStatusMap.get(props.selectedConfig.file) ?? 'enabled'
})
const modeTitle = computed(() => {
  if (props.routeMode === 'disabled') {
    return t('states.disabledTitle')
  }
  if (props.routeMode === 'ignored') {
    return t('states.ignoredTitle')
  }
  return t('states.configTitle')
})
const modeHint = computed(() => {
  if (props.routeMode === 'disabled') {
    return t('states.disabledHint')
  }
  if (props.routeMode === 'ignored') {
    return t('states.ignoredHint')
  }
  return t('states.configHint')
})

const queryModel = computed({
  get: () => props.queryText,
  set: value => emit('update:queryText', value),
})
const headersModel = computed({
  get: () => props.headersText,
  set: value => emit('update:headersText', value),
})
const bodyModel = computed({
  get: () => props.bodyText,
  set: value => emit('update:bodyText', value),
})
const resolvedWorkspaceRoot = computed(() => props.workspaceRoot ?? '')

function handleParamUpdate(name: string, value: string) {
  emit('update:param-value', name, value)
}

function handleRun() {
  emit('run')
}
</script>

<template>
  <RouteDetail
    v-if="isActiveMode"
    v-model:queryText="queryModel"
    v-model:headersText="headersModel"
    v-model:bodyText="bodyModel"
    :selected="props.selected"
    :request-url="props.requestUrl"
    :workspace-root="resolvedWorkspaceRoot"
    :response-text="props.responseText"
    :response-status="props.responseStatus"
    :response-time="props.responseTime"
    :is-sw-registering="props.isSwRegistering"
    :route-params="props.routeParams"
    :param-values="props.paramValues"
    :config-status-map="props.configStatusMap"
    @update:param-value="handleParamUpdate"
    @run="handleRun"
  />
  <RouteDetailInactive
    v-else-if="isDisabledApiMode && props.selectedDisabled"
    mode="disabled"
    :selected="props.selectedDisabled"
    :workspace-root="props.workspaceRoot"
    :config-status-map="props.configStatusMap"
  />
  <RouteDetailInactive
    v-else-if="isIgnoredMode && props.selectedIgnored"
    mode="ignored"
    :selected="props.selectedIgnored"
    :workspace-root="props.workspaceRoot"
    :config-status-map="props.configStatusMap"
  />
  <ConfigDetail
    v-else-if="props.selectedConfig && isConfigMode"
    :selected="props.selectedConfig"
    :impacted="props.configImpactRoutes"
    :is-disabled="selectedConfigStatus === 'disabled'"
    :workspace-root="props.workspaceRoot"
  />
  <div
    v-else
    class="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border p-6 text-center shadow-xl border-pg-border bg-pg-surface-card text-pg-text-muted"
  >
    <p class="text-xl font-display text-pg-text-strong">
      {{ modeTitle }}
    </p>
    <p class="text-sm">
      {{ modeHint }}
    </p>
  </div>
</template>
