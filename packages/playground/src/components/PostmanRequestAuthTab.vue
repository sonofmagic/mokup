<script setup lang="ts">
import type { ApiKeyLocation, AuthType } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiField from './ui/UiField.vue'
import UiTextInput from './ui/UiTextInput.vue'

const props = defineProps<{
  authType: AuthType
  authToken: string
  authUsername: string
  authPassword: string
  authKeyName: string
  authKeyValue: string
  authKeyLocation: ApiKeyLocation
  authCustomName: string
  authCustomValue: string
}>()

const emit = defineEmits<{
  (event: 'update:authType', value: AuthType): void
  (event: 'update:authToken', value: string): void
  (event: 'update:authUsername', value: string): void
  (event: 'update:authPassword', value: string): void
  (event: 'update:authKeyName', value: string): void
  (event: 'update:authKeyValue', value: string): void
  (event: 'update:authKeyLocation', value: ApiKeyLocation): void
  (event: 'update:authCustomName', value: string): void
  (event: 'update:authCustomValue', value: string): void
}>()

const { t } = useI18n()

const authTypeOptions = computed(() => [
  { value: 'none' as AuthType, label: t('detail.authTypeNone') },
  { value: 'bearer' as AuthType, label: t('detail.authTypeBearer') },
  { value: 'basic' as AuthType, label: t('detail.authTypeBasic') },
  { value: 'apikey' as AuthType, label: t('detail.authTypeApiKey') },
  { value: 'custom' as AuthType, label: t('detail.authTypeCustom') },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <UiField :label="t('detail.authType')">
      <div class="flex flex-wrap items-center gap-4 text-[0.65rem] tracking-[0.08em] text-pg-text-muted">
        <label
          v-for="option in authTypeOptions"
          :key="option.value"
          class="inline-flex items-center gap-2 rounded border px-3 py-1 transition border-pg-border bg-pg-surface-strong text-pg-text-soft"
        >
          <input
            class="h-3.5 w-3.5 rounded border-pg-border text-pg-accent"
            type="radio"
            name="authType"
            :checked="props.authType === option.value"
            @change="emit('update:authType', option.value)"
          >
          <span>{{ option.label }}</span>
        </label>
      </div>
    </UiField>

    <div v-if="props.authType === 'bearer'" class="grid gap-3 lg:grid-cols-2">
      <UiField :label="t('detail.authTypeBearerToken')">
        <UiTextInput
          :value="props.authToken"
          placeholder="eyJhbGciOiJIUzI1NiIs..."
          @input="emit('update:authToken', ($event.target as HTMLInputElement | null)?.value ?? '')"
        />
      </UiField>
    </div>

    <div v-else-if="props.authType === 'basic'" class="grid gap-3 lg:grid-cols-2">
      <UiField :label="t('detail.authTypeBasicUsername')">
        <UiTextInput
          :value="props.authUsername"
          placeholder="admin"
          @input="emit('update:authUsername', ($event.target as HTMLInputElement | null)?.value ?? '')"
        />
      </UiField>
      <UiField :label="t('detail.authTypeBasicPassword')">
        <UiTextInput
          :value="props.authPassword"
          type="password"
          placeholder="••••••••"
          @input="emit('update:authPassword', ($event.target as HTMLInputElement | null)?.value ?? '')"
        />
      </UiField>
    </div>

    <div v-else-if="props.authType === 'apikey'" class="grid gap-3 lg:grid-cols-3">
      <UiField :label="t('detail.authTypeApiKeyName')">
        <UiTextInput
          :value="props.authKeyName"
          placeholder="X-API-Key"
          @input="emit('update:authKeyName', ($event.target as HTMLInputElement | null)?.value ?? '')"
        />
      </UiField>
      <UiField :label="t('detail.authTypeApiKeyValue')">
        <UiTextInput
          :value="props.authKeyValue"
          placeholder="sk_live_..."
          @input="emit('update:authKeyValue', ($event.target as HTMLInputElement | null)?.value ?? '')"
        />
      </UiField>
      <UiField :label="t('detail.authTypeApiKeyLocation')">
        <div class="relative">
          <select
            class="w-full appearance-none rounded border px-3 py-2 text-[0.7rem] tracking-[0.08em] outline-none transition border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent"
            :value="props.authKeyLocation"
            @change="emit('update:authKeyLocation', ($event.target as HTMLSelectElement | null)?.value as ApiKeyLocation)"
          >
            <option value="header">
              {{ t('detail.authTypeApiKeyLocationHeader') }}
            </option>
            <option value="query">
              {{ t('detail.authTypeApiKeyLocationQuery') }}
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
    </div>

    <div v-else-if="props.authType === 'custom'" class="grid gap-3 lg:grid-cols-2">
      <UiField :label="t('detail.authTypeCustomName')">
        <UiTextInput
          :value="props.authCustomName"
          placeholder="X-Custom-Auth"
          @input="emit('update:authCustomName', ($event.target as HTMLInputElement | null)?.value ?? '')"
        />
      </UiField>
      <UiField :label="t('detail.authTypeCustomValue')">
        <UiTextInput
          :value="props.authCustomValue"
          placeholder="value"
          @input="emit('update:authCustomValue', ($event.target as HTMLInputElement | null)?.value ?? '')"
        />
      </UiField>
    </div>
  </div>
</template>
