<script setup lang="ts">
import type { BodyType, MultipartFileEntry, PlaygroundRoute, RawBodyType, RouteParamField } from '../types'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PostmanInfoDrawer from './PostmanInfoDrawer.vue'
import PostmanRequestPanel from './PostmanRequestPanel.vue'
import PostmanResponsePanel from './PostmanResponsePanel.vue'

const props = defineProps<{
  selected: PlaygroundRoute | null
  requestUrl: string
  workspaceRoot: string
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
  responseText: string
  responseStatus: string
  responseTime: string
  isSwRegistering: boolean
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
  (event: 'update:param-value', name: string, value: string): void
  (event: 'run'): void
}>()

const { t } = useI18n()
const infoOpen = ref(false)

function toggleInfo() {
  infoOpen.value = !infoOpen.value
}

function closeInfo() {
  infoOpen.value = false
}

watch(
  () => props.selected?.file ?? '',
  () => {
    infoOpen.value = false
  },
)
</script>

<template>
  <section class="flex min-h-0 flex-col gap-4">
    <div v-if="!props.selected" class="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border p-6 text-center shadow-xl border-pg-border bg-pg-surface-card text-pg-text-muted">
      <p class="text-xl font-display text-pg-text-strong">
        {{ t('detail.selectTitle') }}
      </p>
      <p class="text-sm">
        {{ t('detail.selectHint') }}
      </p>
    </div>
    <div v-else class="relative flex min-h-0 h-full flex-col gap-4">
      <PostmanRequestPanel
        :selected="props.selected"
        :request-url="props.requestUrl"
        :route-params="props.routeParams"
        :param-values="props.paramValues"
        :missing-params="props.missingParams"
        :missing-pulse="props.missingPulse"
        :query-text="props.queryText"
        :headers-text="props.headersText"
        :body-text="props.bodyText"
        :body-type="props.bodyType"
        :raw-type="props.rawType"
        :raw-validate="props.rawValidate"
        :multipart-files="props.multipartFiles"
        :binary-file="props.binaryFile"
        :is-sw-registering="props.isSwRegistering"
        @update:queryText="emit('update:queryText', $event)"
        @update:headersText="emit('update:headersText', $event)"
        @update:bodyText="emit('update:bodyText', $event)"
        @update:bodyType="emit('update:bodyType', $event)"
        @update:rawType="emit('update:rawType', $event)"
        @update:rawValidate="emit('update:rawValidate', $event)"
        @update:multipartFiles="emit('update:multipartFiles', $event)"
        @update:binaryFile="emit('update:binaryFile', $event)"
        @update:param-value="(name, value) => emit('update:param-value', name, value)"
        @run="emit('run')"
        @toggle-info="toggleInfo"
      />
      <PostmanResponsePanel
        :response-text="props.responseText"
        :response-status="props.responseStatus"
        :response-time="props.responseTime"
      />
      <PostmanInfoDrawer
        :open="infoOpen"
        :selected="props.selected"
        :workspace-root="props.workspaceRoot"
        :config-status-map="props.configStatusMap"
        @close="closeInfo"
      />
    </div>
  </section>
</template>
