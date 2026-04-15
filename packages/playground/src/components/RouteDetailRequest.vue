<script setup lang="ts">
import type { BodyType, MultipartFileEntry, PlaygroundRoute, RawBodyType, RouteParamField } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRequestEditorState } from '../hooks/useRequestEditorState'
import RouteDetailConfigChain from './RouteDetailConfigChain.vue'
import RouteDetailMiddlewares from './RouteDetailMiddlewares.vue'
import RouteDetailRequestBodyTab from './RouteDetailRequestBodyTab.vue'
import RouteDetailRequestHeader from './RouteDetailRequestHeader.vue'
import UiChipButton from './ui/UiChipButton.vue'
import UiField from './ui/UiField.vue'
import UiPill from './ui/UiPill.vue'
import UiTextarea from './ui/UiTextarea.vue'
import UiTextInput from './ui/UiTextInput.vue'

type RequestTab = 'params' | 'query' | 'headers' | 'body'
const props = defineProps<{
  selected: PlaygroundRoute
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

function resolveDefaultTab() {
  return props.routeParams.length > 0 ? 'params' : 'query'
}
const queryExample = '{ "q": "alpha", "page": 1 }'
const headersExample = '{ "x-mokup": "playground" }'
const configChain = computed(() => props.selected.configChain ?? [])
const {
  activeTab,
  addMultipartRow,
  bodyTypeLabel,
  clearBinaryFile,
  formatBytes,
  hasMissingParams,
  hasRequiredParams,
  missingParamsSet,
  missingPulseActive,
  paramPlaceholder,
  registerMissingParamRef,
  removeMultipartRow,
  resolveBodyPlaceholder,
  resolveMultipartLabel,
  updateBinaryFile,
  updateMultipartFiles,
  updateMultipartName,
} = useRequestEditorState<RequestTab>({
  t,
  selectedUrl: () => props.selected?.url,
  routeParams: () => props.routeParams,
  missingParams: () => props.missingParams,
  missingPulse: () => props.missingPulse,
  bodyType: () => props.bodyType,
  rawType: () => props.rawType,
  multipartFiles: () => props.multipartFiles,
  setMultipartFiles: value => emit('update:multipartFiles', value),
  setBinaryFile: value => emit('update:binaryFile', value),
  resolveDefaultTab,
  syncRouteParamsTab: (length, previous, current) => {
    if (!props.selected) {
      return 'query'
    }
    if (length > 0 && previous === 0 && current === 'query') {
      return 'params'
    }
    if (length === 0 && current === 'params') {
      return 'query'
    }
    return null
  },
})
</script>

<template>
  <section class="rounded border border-pg-border bg-pg-surface-card">
    <RouteDetailRequestHeader
      :method="props.selected.method"
      :request-url="props.requestUrl"
      :file="props.selected.file"
      :is-sw-registering="props.isSwRegistering"
      @run="emit('run')"
    />
    <RouteDetailConfigChain
      :config-chain="configChain"
      :config-status-map="props.configStatusMap"
      :workspace-root="props.workspaceRoot"
    />
    <RouteDetailMiddlewares
      :selected="props.selected"
      :workspace-root="props.workspaceRoot"
    />
    <div class="border-t p-4 border-pg-border">
      <div class="flex flex-wrap gap-2">
        <UiChipButton
          size="md"
          :active="activeTab === 'params'"
          :class="[
            hasMissingParams ? 'pg-tab-missing' : '',
            missingPulseActive && hasMissingParams ? 'pg-pulse' : '',
          ]"
          @click="activeTab = 'params'"
        >
          <span>{{ t('detail.params') }}</span>
          <UiPill
            v-if="hasRequiredParams"
            size="xxs"
            tone="chip"
            :caps="false"
            class="pg-tab-badge"
          >
            {{ t('detail.badgeRequired') }}
          </UiPill>
        </UiChipButton>
        <UiChipButton
          size="md"
          :active="activeTab === 'query'"
          @click="activeTab = 'query'"
        >
          <span>{{ t('detail.query') }}</span>
          <UiPill size="xxs" tone="chip" :caps="false" class="pg-tab-badge">
            {{ t('detail.badgeJson') }}
          </UiPill>
        </UiChipButton>
        <UiChipButton
          size="md"
          :active="activeTab === 'headers'"
          @click="activeTab = 'headers'"
        >
          <span>{{ t('detail.headers') }}</span>
          <UiPill size="xxs" tone="chip" :caps="false" class="pg-tab-badge">
            {{ t('detail.badgeJson') }}
          </UiPill>
        </UiChipButton>
        <UiChipButton
          size="md"
          :active="activeTab === 'body'"
          @click="activeTab = 'body'"
        >
          <span>{{ t('detail.body') }}</span>
          <UiPill size="xxs" tone="chip" :caps="false" class="pg-tab-badge">
            {{ bodyTypeLabel }}
          </UiPill>
        </UiChipButton>
      </div>
      <div class="mt-4">
        <div v-show="activeTab === 'params'">
          <div
            v-if="props.routeParams.length === 0"
            class="rounded border px-4 py-3 text-sm border-pg-border bg-pg-surface-strong text-pg-text-muted"
          >
            {{ t('detail.emptyParams') }}
          </div>
          <div v-else class="grid gap-3 lg:grid-cols-2">
            <label
              v-for="param in props.routeParams"
              :key="param.id"
              :ref="(el) => registerMissingParamRef(param.name, el as HTMLElement | null)"
              class="flex flex-col gap-1.5 text-[0.65rem] tracking-[0.08em] text-pg-text-muted"
            >
              <span class="flex items-center gap-2 text-[0.55rem] tracking-[0.08em] text-pg-text-muted">
                <span>{{ param.name }}</span>
                <span class="rounded border px-2 py-0.5 text-[0.5rem] tracking-[0.08em] border-pg-border bg-pg-surface-strong text-pg-text-soft">
                  {{ param.token }}
                </span>
              </span>
              <UiTextInput
                :value="props.paramValues[param.name] ?? ''"
                :placeholder="paramPlaceholder(param)"
                :class="[
                  missingParamsSet.has(param.name) ? 'pg-input-missing' : '',
                  missingPulseActive && missingParamsSet.has(param.name) ? 'pg-pulse' : '',
                ]"
                @input="emit('update:param-value', param.name, ($event.target as HTMLInputElement | null)?.value ?? '')"
              />
            </label>
          </div>
        </div>
        <div v-show="activeTab === 'query'">
          <UiField :label="t('detail.query')">
            <UiTextarea
              :value="props.queryText"
              rows="4"
              :placeholder="t('detail.queryPlaceholder', { json: queryExample })"
              @input="emit('update:queryText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </UiField>
        </div>
        <div v-show="activeTab === 'headers'">
          <UiField :label="t('detail.headers')">
            <UiTextarea
              :value="props.headersText"
              rows="4"
              :placeholder="t('detail.headersPlaceholder', { json: headersExample })"
              @input="emit('update:headersText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </UiField>
        </div>
        <RouteDetailRequestBodyTab
          v-show="activeTab === 'body'"
          :body-type="props.bodyType"
          :raw-type="props.rawType"
          :raw-validate="props.rawValidate"
          :body-text="props.bodyText"
          :multipart-files="props.multipartFiles"
          :binary-file="props.binaryFile"
          :format-bytes="formatBytes"
          :resolve-body-placeholder="resolveBodyPlaceholder"
          :resolve-multipart-label="resolveMultipartLabel"
          :add-multipart-row="addMultipartRow"
          :remove-multipart-row="removeMultipartRow"
          :update-binary-file="updateBinaryFile"
          :clear-binary-file="clearBinaryFile"
          :update-multipart-name="updateMultipartName"
          :update-multipart-files="updateMultipartFiles"
          @update:bodyType="emit('update:bodyType', $event)"
          @update:rawType="emit('update:rawType', $event)"
          @update:rawValidate="emit('update:rawValidate', $event)"
          @update:bodyText="emit('update:bodyText', $event)"
        />
      </div>
    </div>
  </section>
</template>
