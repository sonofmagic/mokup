<script setup lang="ts">
import type { RouteParamField } from '../types'
import { useI18n } from 'vue-i18n'
import UiField from './ui/UiField.vue'
import UiTextarea from './ui/UiTextarea.vue'
import UiTextInput from './ui/UiTextInput.vue'

const props = defineProps<{
  routeParams: RouteParamField[]
  paramValues: Record<string, string>
  queryText: string
  missingParamsSet: Set<string>
  missingPulseActive: boolean
  paramPlaceholder: (param: RouteParamField) => string
  registerMissingParamRef: (name: string, element: HTMLElement | null) => void
}>()

const emit = defineEmits<{
  (event: 'update:param-value', name: string, value: string): void
  (event: 'update:queryText', value: string): void
}>()

const { t } = useI18n()
const queryExample = '{ "q": "alpha", "page": 1 }'
</script>

<template>
  <div class="flex flex-col gap-4">
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
          :ref="(el) => props.registerMissingParamRef(param.name, el as HTMLElement | null)"
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
            :placeholder="props.paramPlaceholder(param)"
            :class="[
              props.missingParamsSet.has(param.name) ? 'pg-input-missing' : '',
              props.missingPulseActive && props.missingParamsSet.has(param.name) ? 'pg-pulse' : '',
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
</template>
