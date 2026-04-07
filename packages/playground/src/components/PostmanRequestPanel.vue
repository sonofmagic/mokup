<script setup lang="ts">
import type { BodyType, MultipartFileEntry, PlaygroundRoute, RawBodyType, RouteParamField } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRequestEditorState } from '../hooks/useRequestEditorState'
import UiField from './ui/UiField.vue'
import UiPill from './ui/UiPill.vue'
import UiTextarea from './ui/UiTextarea.vue'
import UiTextInput from './ui/UiTextInput.vue'

type RequestTab = 'params' | 'auth' | 'headers' | 'body'
const props = defineProps<{
  selected: PlaygroundRoute
  requestUrl: string
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
  (event: 'toggle-info'): void
}>()
const { t } = useI18n()

const methodBadge = computed(() => `method-${props.selected.method.toLowerCase()}`)
const queryExample = '{ "q": "alpha", "page": 1 }'
const headersExample = '{ "x-mokup": "playground" }'
const {
  activeTab,
  addMultipartRow,
  bodyTypeLabel,
  clearBinaryFile,
  formatBytes,
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
</script>

<template>
  <section class="rounded border border-pg-border bg-pg-surface-card">
    <div class="flex flex-col gap-3 px-4 py-4">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="rounded-md px-2.5 py-1 text-[0.6rem] tracking-[0.08em]"
          :class="methodBadge"
        >
          {{ props.selected.method }}
        </span>
        <UiTextInput
          :value="props.requestUrl"
          readonly
          class="min-w-[220px] flex-1"
        />
        <button
          class="inline-flex items-center gap-2 rounded px-4 py-2 text-[0.65rem] tracking-[0.1em] transition disabled:cursor-not-allowed disabled:opacity-70 bg-pg-accent text-pg-on-accent"
          data-testid="playground-run"
          :disabled="props.isSwRegistering"
          :aria-busy="props.isSwRegistering"
          @click="emit('run')"
        >
          <span
            v-if="props.isSwRegistering"
            class="i-[carbon--circle-dash] h-3.5 w-3.5 animate-spin"
            aria-hidden="true"
          />
          {{ t('detail.run') }}
        </button>
        <button
          class="inline-flex items-center gap-2 rounded border px-3 py-2 text-[0.6rem] tracking-[0.1em] transition border-pg-border bg-pg-surface-strong text-pg-text-muted hover:text-pg-text-soft"
          type="button"
          @click="emit('toggle-info')"
        >
          <span class="i-[carbon--information] h-3.5 w-3.5" aria-hidden="true" />
          {{ t('detail.info') }}
        </button>
      </div>
      <div class="text-[0.65rem] text-pg-text-subtle">
        {{ props.selected.file }}
      </div>
    </div>

    <div class="border-t border-pg-border">
      <div class="flex flex-wrap items-center gap-5 px-4 pt-2 text-[0.65rem] tracking-[0.1em]">
        <button
          type="button"
          class="border-b-2 pb-2 transition"
          :class="activeTab === 'params'
            ? 'border-pg-accent text-pg-text-strong'
            : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
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
      </div>

      <div class="border-t px-4 py-4 border-pg-border">
        <div v-show="activeTab === 'params'" class="flex flex-col gap-4">
          <div>
            <div class="mb-2 text-[0.55rem] tracking-[0.1em] text-pg-text-muted">
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
            <UiTextarea
              :value="props.queryText"
              rows="4"
              :placeholder="t('detail.queryPlaceholder', { json: queryExample })"
              @input="emit('update:queryText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </UiField>
        </div>

        <div v-show="activeTab === 'auth'">
          <div class="rounded border px-4 py-3 text-sm border-pg-border bg-pg-surface-strong text-pg-text-muted">
            {{ t('detail.authPlaceholder') }}
          </div>
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

        <div v-show="activeTab === 'body'">
          <UiField :label="t('detail.bodyType')">
            <div class="relative">
              <select
                class="w-full appearance-none rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] outline-none transition border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent"
                :value="bodyType"
                @change="emit('update:bodyType', ($event.target as HTMLSelectElement | null)?.value as BodyType)"
              >
                <option value="none">
                  {{ t('detail.bodyTypeNone') }}
                </option>
                <option value="form-data">
                  {{ t('detail.bodyTypeFormData') }}
                </option>
                <option value="form-urlencoded">
                  {{ t('detail.bodyTypeFormUrlencoded') }}
                </option>
                <option value="raw">
                  {{ t('detail.bodyTypeRaw') }}
                </option>
                <option value="binary">
                  {{ t('detail.bodyTypeBinary') }}
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
          <div v-if="props.bodyType === 'raw'" class="mt-3 flex flex-wrap items-center gap-3">
            <UiField :label="t('detail.rawType')" class="flex-1 min-w-[200px]">
              <div class="relative">
                <select
                  class="w-full appearance-none rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] outline-none transition border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent"
                  :value="props.rawType"
                  @change="emit('update:rawType', ($event.target as HTMLSelectElement | null)?.value as RawBodyType)"
                >
                  <option value="text">
                    {{ t('detail.rawTypeText') }}
                  </option>
                  <option value="javascript">
                    {{ t('detail.rawTypeJavascript') }}
                  </option>
                  <option value="json">
                    {{ t('detail.rawTypeJson') }}
                  </option>
                  <option value="html">
                    {{ t('detail.rawTypeHtml') }}
                  </option>
                  <option value="xml">
                    {{ t('detail.rawTypeXml') }}
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

          <div v-if="props.bodyType === 'none'" class="rounded border px-4 py-3 text-sm border-pg-border bg-pg-surface-strong text-pg-text-muted">
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
            <UiTextarea
              :value="props.bodyText"
              rows="6"
              :placeholder="resolveBodyPlaceholder()"
              @input="emit('update:bodyText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
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
      </div>
    </div>
  </section>
</template>
