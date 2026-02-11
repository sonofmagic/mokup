<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiTextInput from './ui/UiTextInput.vue'

const props = defineProps<{
  method: string
  requestUrl: string
  file: string
  isSwRegistering: boolean
}>()

const emit = defineEmits<{
  (event: 'run'): void
}>()

const { t } = useI18n()

const methodBadge = computed(() => `method-${props.method.toLowerCase()}`)
</script>

<template>
  <div>
    <div class="flex items-center justify-between border-b px-4 py-3 text-[0.65rem] tracking-[0.08em] border-pg-border text-pg-text-muted">
      <span>{{ t('detail.requestLabel') }}</span>
      <span class="truncate text-[0.65rem] normal-case tracking-normal text-pg-text-subtle">
        {{ props.file }}
      </span>
    </div>
    <div class="flex flex-wrap items-center gap-3 px-4 py-3">
      <span
        class="rounded border px-3 py-1 text-[0.6rem] tracking-[0.08em]"
        :class="methodBadge"
      >
        {{ props.method }}
      </span>
      <UiTextInput
        :value="props.requestUrl"
        readonly
        class="min-w-[220px] flex-1"
      />
      <button
        class="flex items-center gap-2 rounded px-4 py-2 text-[0.65rem] tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-70 bg-pg-accent text-pg-on-accent"
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
    </div>
  </div>
</template>
