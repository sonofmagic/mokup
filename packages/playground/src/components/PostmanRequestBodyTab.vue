<script setup lang="ts">
import type { BodyType, MultipartFileEntry, RawBodyType } from '../types'
import { computed, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import UiField from './ui/UiField.vue'
import UiTextInput from './ui/UiTextInput.vue'

const props = defineProps<{
  bodyType: BodyType
  rawType: RawBodyType
  rawValidate: boolean
  bodyText: string
  multipartFiles: MultipartFileEntry[]
  binaryFile: File | null
  formatBytes: (value: number) => string
  resolveBodyPlaceholder: () => string
  resolveMultipartLabel: (entry: MultipartFileEntry) => string
  addMultipartRow: () => void
  removeMultipartRow: (id: string) => void
  updateBinaryFile: (event: Event) => void
  clearBinaryFile: () => void
  updateMultipartName: (id: string, value: string) => void
  updateMultipartFiles: (id: string, event: Event) => void
}>()

const emit = defineEmits<{
  (event: 'update:bodyType', value: BodyType): void
  (event: 'update:rawType', value: RawBodyType): void
  (event: 'update:rawValidate', value: boolean): void
  (event: 'update:bodyText', value: string): void
}>()

type BodyOption
  = | { value: BodyType, label: string, disabled?: false }
    | { value: 'graphql', label: string, disabled: true }

const UiCodeEditor = defineAsyncComponent({
  loader: () => import('./ui/UiCodeEditor.vue'),
  suspensible: false,
})

const { t } = useI18n()

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

const bodyEditorLanguage = computed<'text' | 'json'>(() => {
  if (props.bodyType === 'raw' && props.rawType === 'json') {
    return 'json'
  }
  return 'text'
})
</script>

<template>
  <div>
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
              @change="props.updateBinaryFile"
            >
            <span>{{ props.binaryFile ? t('detail.bodyBinarySelected', { name: props.binaryFile.name, size: props.formatBytes(props.binaryFile.size) }) : t('detail.bodyBinaryChoose') }}</span>
          </label>
          <button
            v-if="props.binaryFile"
            class="rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] transition border-pg-border bg-pg-surface-card text-pg-text-muted hover:text-pg-text-soft"
            type="button"
            @click="props.clearBinaryFile"
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
        :placeholder="props.resolveBodyPlaceholder()"
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
                @input="props.updateMultipartName(row.id, ($event.target as HTMLInputElement | null)?.value ?? '')"
              />
              <label class="flex items-center gap-2 rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] border-pg-border bg-pg-surface-card text-pg-text-muted">
                <input
                  class="sr-only"
                  type="file"
                  multiple
                  @change="props.updateMultipartFiles(row.id, $event)"
                >
                <span>{{ props.resolveMultipartLabel(row) }}</span>
              </label>
              <button
                class="rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] transition border-pg-border bg-pg-surface-card text-pg-text-muted hover:text-pg-text-soft"
                type="button"
                @click="props.removeMultipartRow(row.id)"
              >
                {{ t('detail.bodyMultipartRemove') }}
              </button>
            </div>
          </div>
          <button
            class="w-full rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] transition border-dashed border-pg-border bg-pg-surface-card text-pg-text-muted hover:text-pg-text-soft"
            type="button"
            @click="props.addMultipartRow"
          >
            {{ t('detail.bodyMultipartAdd') }}
          </button>
        </div>
      </UiField>
    </div>
  </div>
</template>
