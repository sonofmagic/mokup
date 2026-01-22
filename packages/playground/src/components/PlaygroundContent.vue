<script setup lang="ts">
import type { PlaygroundRoute, RouteParamField } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import RouteDetail from './RouteDetail.vue'

const props = defineProps<{
  selected: PlaygroundRoute | null
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
  isDisabledMode: boolean
}>()

const emit = defineEmits<{
  (event: 'update:queryText', value: string): void
  (event: 'update:headersText', value: string): void
  (event: 'update:bodyText', value: string): void
  (event: 'update:param-value', name: string, value: string): void
  (event: 'run'): void
}>()

const { t } = useI18n()

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
    v-if="!props.isDisabledMode"
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
    @update:param-value="handleParamUpdate"
    @run="handleRun"
  />
  <div
    v-else
    class="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border p-6 text-center shadow-xl border-pg-border bg-pg-surface-card text-pg-text-muted"
  >
    <p class="text-xl font-display text-pg-text-strong">
      {{ t('states.disabledTitle') }}
    </p>
    <p class="text-sm">
      {{ t('states.disabledHint') }}
    </p>
  </div>
</template>
