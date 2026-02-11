<script setup lang="ts">
import type {
  ApiKeyLocation,
  AuthType,
  BodyType,
  MultipartFileEntry,
  PlaygroundConfigFile,
  PlaygroundConfigImpactRoute,
  PlaygroundDisabledRoute,
  PlaygroundIgnoredRoute,
  PlaygroundRoute,
  RawBodyType,
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
  missingParams: string[]
  missingPulse: number
  queryText: string
  headersText: string
  bodyText: string
  bodyType: BodyType
  rawType: RawBodyType
  rawValidate: boolean
  multipartFiles: MultipartFileEntry[]
  binaryFile: File | null
  authType: AuthType
  authToken: string
  authUsername: string
  authPassword: string
  authKeyName: string
  authKeyValue: string
  authKeyLocation: ApiKeyLocation
  authCustomName: string
  authCustomValue: string
  responseRaw: string
  responsePretty: string
  responseHeaders: Record<string, string>
  responseContentType: string
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
  (event: 'update:bodyType', value: BodyType): void
  (event: 'update:rawType', value: RawBodyType): void
  (event: 'update:rawValidate', value: boolean): void
  (event: 'update:multipartFiles', value: MultipartFileEntry[]): void
  (event: 'update:binaryFile', value: File | null): void
  (event: 'update:authType', value: AuthType): void
  (event: 'update:authToken', value: string): void
  (event: 'update:authUsername', value: string): void
  (event: 'update:authPassword', value: string): void
  (event: 'update:authKeyName', value: string): void
  (event: 'update:authKeyValue', value: string): void
  (event: 'update:authKeyLocation', value: ApiKeyLocation): void
  (event: 'update:authCustomName', value: string): void
  (event: 'update:authCustomValue', value: string): void
  (event: 'update:param-value', name: string, value: string): void
  (event: 'run'): void
}>()

const { t } = useI18n()

const isActiveMode = computed(() => props.routeMode === 'active' && props.enabledMode === 'api')
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
const bodyTypeModel = computed({
  get: () => props.bodyType,
  set: value => emit('update:bodyType', value),
})
const rawTypeModel = computed({
  get: () => props.rawType,
  set: value => emit('update:rawType', value),
})
const rawValidateModel = computed({
  get: () => props.rawValidate,
  set: value => emit('update:rawValidate', value),
})
const multipartFilesModel = computed({
  get: () => props.multipartFiles,
  set: value => emit('update:multipartFiles', value),
})
const binaryFileModel = computed({
  get: () => props.binaryFile,
  set: value => emit('update:binaryFile', value),
})
const authTypeModel = computed({
  get: () => props.authType,
  set: value => emit('update:authType', value),
})
const authTokenModel = computed({
  get: () => props.authToken,
  set: value => emit('update:authToken', value),
})
const authUsernameModel = computed({
  get: () => props.authUsername,
  set: value => emit('update:authUsername', value),
})
const authPasswordModel = computed({
  get: () => props.authPassword,
  set: value => emit('update:authPassword', value),
})
const authKeyNameModel = computed({
  get: () => props.authKeyName,
  set: value => emit('update:authKeyName', value),
})
const authKeyValueModel = computed({
  get: () => props.authKeyValue,
  set: value => emit('update:authKeyValue', value),
})
const authKeyLocationModel = computed({
  get: () => props.authKeyLocation,
  set: value => emit('update:authKeyLocation', value),
})
const authCustomNameModel = computed({
  get: () => props.authCustomName,
  set: value => emit('update:authCustomName', value),
})
const authCustomValueModel = computed({
  get: () => props.authCustomValue,
  set: value => emit('update:authCustomValue', value),
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
    v-model:bodyType="bodyTypeModel"
    v-model:rawType="rawTypeModel"
    v-model:rawValidate="rawValidateModel"
    v-model:multipartFiles="multipartFilesModel"
    v-model:binaryFile="binaryFileModel"
    v-model:authType="authTypeModel"
    v-model:authToken="authTokenModel"
    v-model:authUsername="authUsernameModel"
    v-model:authPassword="authPasswordModel"
    v-model:authKeyName="authKeyNameModel"
    v-model:authKeyValue="authKeyValueModel"
    v-model:authKeyLocation="authKeyLocationModel"
    v-model:authCustomName="authCustomNameModel"
    v-model:authCustomValue="authCustomValueModel"
    :selected="props.selected"
    :request-url="props.requestUrl"
    :workspace-root="resolvedWorkspaceRoot"
    :response-raw="props.responseRaw"
    :response-pretty="props.responsePretty"
    :response-headers="props.responseHeaders"
    :response-content-type="props.responseContentType"
    :response-status="props.responseStatus"
    :response-time="props.responseTime"
    :is-sw-registering="props.isSwRegistering"
    :route-params="props.routeParams"
    :param-values="props.paramValues"
    :missing-params="props.missingParams"
    :missing-pulse="props.missingPulse"
    :config-status-map="props.configStatusMap"
    @update:param-value="handleParamUpdate"
    @run="handleRun"
  />
  <RouteDetailInactive
    v-else-if="isDisabledApiMode && props.selectedDisabled"
    mode="disabled"
    :selected="props.selectedDisabled"
    :workspace-root="resolvedWorkspaceRoot"
    :config-status-map="props.configStatusMap"
  />
  <RouteDetailInactive
    v-else-if="isIgnoredMode && props.selectedIgnored"
    mode="ignored"
    :selected="props.selectedIgnored"
    :workspace-root="resolvedWorkspaceRoot"
    :config-status-map="props.configStatusMap"
  />
  <ConfigDetail
    v-else-if="props.selectedConfig"
    :selected="props.selectedConfig"
    :impacted="props.configImpactRoutes"
    :is-disabled="selectedConfigStatus === 'disabled'"
    :workspace-root="resolvedWorkspaceRoot"
  />
  <div
    v-else
    class="flex h-full flex-col items-center justify-center gap-3 rounded border p-6 text-center border-pg-border bg-pg-surface-card text-pg-text-muted"
  >
    <p class="text-xl font-display text-pg-text-strong">
      {{ modeTitle }}
    </p>
    <p class="text-sm">
      {{ modeHint }}
    </p>
  </div>
</template>
