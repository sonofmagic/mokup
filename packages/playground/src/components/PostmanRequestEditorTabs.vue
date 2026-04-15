<script setup lang="ts">
import type { ApiKeyLocation, AuthType, BodyType, MultipartFileEntry, PlaygroundRoute, RawBodyType, RouteParamField } from '../types'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRequestEditorState } from '../hooks/useRequestEditorState'
import PostmanRequestAuthTab from './PostmanRequestAuthTab.vue'
import RouteDetailConfigChain from './RouteDetailConfigChain.vue'
import RouteDetailMiddlewares from './RouteDetailMiddlewares.vue'
import UiField from './ui/UiField.vue'
import UiPill from './ui/UiPill.vue'
import UiTextInput from './ui/UiTextInput.vue'

const props = defineProps<{
  selected: PlaygroundRoute
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
  authType: AuthType
  authToken: string
  authUsername: string
  authPassword: string
  authKeyName: string
  authKeyValue: string
  authKeyLocation: ApiKeyLocation
  authCustomName: string
  authCustomValue: string
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
}>()

const UiCodeEditor = defineAsyncComponent({
  loader: () => import('./ui/UiCodeEditor.vue'),
  suspensible: false,
})

type RequestTab = 'params' | 'auth' | 'headers' | 'body' | 'config' | 'middlewares'
type BodyOption
  = | { value: BodyType, label: string, disabled?: false }
    | { value: 'graphql', label: string, disabled: true }

const { t } = useI18n()

const configChainProps = computed(() => {
  const configChain = props.selected.configChain
  return configChain !== undefined ? { configChain } : {}
})

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
  resolveDefaultTab: () => 'params',
})

const bodyTypeOptions = computed<BodyOption[]>(() => [
  { value: 'none', label: t('detail.bodyTypeNone') },
  { value: 'form-data', label: t('detail.bodyTypeFormData') },
  { value: 'form-urlencoded', label: t('detail.bodyTypeFormUrlencoded') },
  { value: 'raw', label: t('detail.bodyTypeRaw') },
  { value: 'binary', label: t('detail.bodyTypeBinary') },
  { value: 'graphql', label: t('detail.bodyTypeGraphql'), disabled: true },
])

const rawTypeOptions = computed(() => [
  { value: 'text', label: t('detail.rawTypeText') },
  { value: 'javascript', label: t('detail.rawTypeJavascript') },
  { value: 'json', label: t('detail.rawTypeJson') },
  { value: 'html', label: t('detail.rawTypeHtml') },
  { value: 'xml', label: t('detail.rawTypeXml') },
])

const queryExample = '{ "q": "alpha", "page": 1 }'
const headersExample = '{ "x-mokup": "playground" }'

const bodyEditorLanguage = computed<'text' | 'json'>(() => {
  if (props.bodyType === 'raw' && props.rawType === 'json') {
    return 'json'
  }
  return 'text'
})
</script>

<template>
  <div class="border-t border-pg-border">
    <div class="flex flex-wrap items-center gap-5 px-4 pt-2 text-[0.65rem] tracking-[0.1em]" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'params'"
        class="border-b-2 pb-2 transition"
        :class="[
          activeTab === 'params'
            ? 'border-pg-accent text-pg-text-strong'
            : 'border-transparent text-pg-text-muted hover:text-pg-text-soft',
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
          class="ml-2"
        >
          {{ t('detail.badgeRequired') }}
        </UiPill>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'auth'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'auth'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'auth'"
      >
        {{ t('detail.auth') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'headers'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'headers'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'headers'"
      >
        {{ t('detail.headers') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'body'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'body'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'body'"
      >
        {{ t('detail.body') }}
        <UiPill size="xxs" tone="chip" :caps="false" class="ml-2">
          {{ bodyTypeLabel }}
        </UiPill>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'config'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'config'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'config'"
      >
        {{ t('detail.configChain') }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'middlewares'"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'middlewares'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'middlewares'"
      >
        {{ t('detail.middlewares') }}
      </button>
    </div>

    <div class="border-t px-4 py-4 border-pg-border">
      <div v-show="activeTab === 'params'" class="flex flex-col gap-4">
        <div>
          <div class="mb-1.5 text-[0.55rem] tracking-[0.1em] text-pg-text-muted">
            {{ t('detail.params') }}
          </div>
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
        <UiField :label="t('detail.query')">
          <UiCodeEditor
            :model-value="props.queryText"
            language="json"
            :rows="4"
            :format-label="t('detail.formatJson')"
            :placeholder="t('detail.queryPlaceholder', { json: queryExample })"
            @update:model-value="emit('update:queryText', $event)"
          />
        </UiField>
      </div>

      <PostmanRequestAuthTab
        v-if="activeTab === 'auth'"
        :auth-type="props.authType"
        :auth-token="props.authToken"
        :auth-username="props.authUsername"
        :auth-password="props.authPassword"
        :auth-key-name="props.authKeyName"
        :auth-key-value="props.authKeyValue"
        :auth-key-location="props.authKeyLocation"
        :auth-custom-name="props.authCustomName"
        :auth-custom-value="props.authCustomValue"
        @update:authType="emit('update:authType', $event)"
        @update:authToken="emit('update:authToken', $event)"
        @update:authUsername="emit('update:authUsername', $event)"
        @update:authPassword="emit('update:authPassword', $event)"
        @update:authKeyName="emit('update:authKeyName', $event)"
        @update:authKeyValue="emit('update:authKeyValue', $event)"
        @update:authKeyLocation="emit('update:authKeyLocation', $event)"
        @update:authCustomName="emit('update:authCustomName', $event)"
        @update:authCustomValue="emit('update:authCustomValue', $event)"
      />

      <div v-else-if="activeTab === 'headers'">
        <UiField :label="t('detail.headers')">
          <UiCodeEditor
            :model-value="props.headersText"
            language="json"
            :rows="4"
            :format-label="t('detail.formatJson')"
            :placeholder="t('detail.headersPlaceholder', { json: headersExample })"
            @update:model-value="emit('update:headersText', $event)"
          />
        </UiField>
      </div>

      <div v-else-if="activeTab === 'body'">
        <UiField :label="t('detail.bodyType')">
          <div class="flex flex-wrap items-center gap-4 text-[0.65rem] tracking-[0.08em] text-pg-text-muted">
            <label
              v-for="option in bodyTypeOptions"
              :key="option.value"
              class="inline-flex items-center gap-2 rounded border px-3 py-1 transition border-pg-border bg-pg-surface-strong"
              :class="option.disabled ? 'opacity-60 cursor-not-allowed' : 'text-pg-text-soft'"
            >
              <input
                class="h-3.5 w-3.5 rounded border-pg-border text-pg-accent"
                type="radio"
                name="bodyType"
                :disabled="option.disabled"
                :checked="props.bodyType === option.value"
                @change="option.disabled ? null : emit('update:bodyType', option.value as BodyType)"
              >
              <span>{{ option.label }}</span>
            </label>
          </div>
        </UiField>

        <div v-if="props.bodyType === 'raw'" class="mt-3 flex flex-wrap items-center gap-3">
          <UiField :label="t('detail.rawType')" class="flex-1 min-w-[200px]">
            <div class="relative">
              <select
                class="w-full appearance-none rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] outline-none transition border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent"
                :value="props.rawType"
                @change="emit('update:rawType', ($event.target as HTMLSelectElement | null)?.value as RawBodyType)"
              >
                <option v-for="option in rawTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <span
                class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pg-text-muted"
                aria-hidden="true"
              >
                <span class="i-[carbon--chevron-down] block h-4 w-4" />
              </span>
            </div>
          </UiField>
          <label
            v-if="props.rawType === 'json'"
            class="flex items-center gap-2 rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] border-pg-border bg-pg-surface-strong text-pg-text-muted"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-pg-border text-pg-accent"
              :checked="props.rawValidate"
              @change="emit('update:rawValidate', ($event.target as HTMLInputElement | null)?.checked ?? true)"
            >
            <span>{{ t('detail.rawValidate') }}</span>
          </label>
        </div>

        <div v-if="props.bodyType === 'none'" class="mt-3 rounded border px-4 py-3 text-sm border-pg-border bg-pg-surface-strong text-pg-text-muted">
          {{ t('detail.bodyNoneHint') }}
        </div>
        <div v-else-if="props.bodyType === 'binary'" class="mt-2">
          <UiField :label="t('detail.bodyBinaryFile')">
            <div class="flex flex-wrap items-center gap-3">
              <label class="flex items-center gap-2 rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] border-pg-border bg-pg-surface-card text-pg-text-muted">
                <input
                  class="sr-only"
                  type="file"
                  @change="updateBinaryFile"
                >
                <span>{{ props.binaryFile ? t('detail.bodyBinarySelected', { name: props.binaryFile.name, size: formatBytes(props.binaryFile.size) }) : t('detail.bodyBinaryChoose') }}</span>
              </label>
              <button
                v-if="props.binaryFile"
                class="rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] transition border-pg-border bg-pg-surface-card text-pg-text-muted hover:text-pg-text-soft"
                type="button"
                @click="clearBinaryFile"
              >
                {{ t('detail.bodyBinaryRemove') }}
              </button>
            </div>
          </UiField>
        </div>
        <UiField
          v-else
          :label="t('detail.body')"
        >
          <UiCodeEditor
            :model-value="props.bodyText"
            :language="bodyEditorLanguage"
            :rows="6"
            :format-label="t('detail.formatJson')"
            :placeholder="resolveBodyPlaceholder()"
            @update:model-value="emit('update:bodyText', $event)"
          />
        </UiField>
        <div v-if="props.bodyType === 'form-data'" class="mt-4">
          <UiField :label="t('detail.bodyMultipartFiles')">
            <div class="mt-2 flex flex-col gap-2">
              <div
                v-for="row in props.multipartFiles"
                :key="row.id"
                class="rounded border p-3 border-pg-border bg-pg-surface-strong"
              >
                <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
                  <UiTextInput
                    class="flex-1"
                    :value="row.name"
                    :placeholder="t('detail.bodyMultipartField')"
                    @input="updateMultipartName(row.id, ($event.target as HTMLInputElement | null)?.value ?? '')"
                  />
                  <label class="flex items-center gap-2 rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] border-pg-border bg-pg-surface-card text-pg-text-muted">
                    <input
                      class="sr-only"
                      type="file"
                      multiple
                      @change="updateMultipartFiles(row.id, $event)"
                    >
                    <span>{{ resolveMultipartLabel(row) }}</span>
                  </label>
                  <button
                    class="rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] transition border-pg-border bg-pg-surface-card text-pg-text-muted hover:text-pg-text-soft"
                    type="button"
                    @click="removeMultipartRow(row.id)"
                  >
                    {{ t('detail.bodyMultipartRemove') }}
                  </button>
                </div>
              </div>
              <button
                class="w-full rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] transition border-dashed border-pg-border bg-pg-surface-card text-pg-text-muted hover:text-pg-text-soft"
                type="button"
                @click="addMultipartRow"
              >
                {{ t('detail.bodyMultipartAdd') }}
              </button>
            </div>
          </UiField>
        </div>
      </div>

      <div v-show="activeTab === 'config'" class="rounded border border-pg-border bg-pg-surface-strong">
        <RouteDetailConfigChain
          v-bind="configChainProps"
          :config-status-map="props.configStatusMap"
          :workspace-root="props.workspaceRoot"
        />
      </div>

      <div v-show="activeTab === 'middlewares'" class="rounded border border-pg-border bg-pg-surface-strong">
        <RouteDetailMiddlewares
          :selected="props.selected"
          :workspace-root="props.workspaceRoot"
        />
      </div>
    </div>
  </div>
</template>
