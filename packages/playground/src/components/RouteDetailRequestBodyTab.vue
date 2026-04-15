<script setup lang="ts">
import type { BodyType, MultipartFileEntry, RawBodyType } from '../types'
import { useI18n } from 'vue-i18n'
import UiField from './ui/UiField.vue'
import UiTextarea from './ui/UiTextarea.vue'
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

const { t } = useI18n()
</script>

<template>
  <div>
    <UiField :label="t('detail.bodyType')">
      <div class="relative">
        <select
          class="w-full appearance-none rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] outline-none transition border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent"
          :value="props.bodyType"
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
    <UiField v-else :label="t('detail.body')">
      <UiTextarea
        :value="props.bodyText"
        rows="6"
        :placeholder="props.resolveBodyPlaceholder()"
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
