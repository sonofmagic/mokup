<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  search: string
  basePath: string
}>()

const emit = defineEmits<{
  (event: 'update:search', value: string): void
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:search', target?.value ?? '')
}

const { t } = useI18n()
</script>

<template>
  <section class="grid gap-3">
    <label class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/60">
      {{ t('filters.search') }}
      <input
        :value="search"
        type="search"
        class="rounded-lg border border-amber-900/10 bg-white/80 px-3 py-2 text-sm text-amber-950 outline-none transition focus:border-amber-500 dark:border-amber-100/10 dark:bg-slate-900/80 dark:text-amber-50"
        :placeholder="t('filters.searchPlaceholder')"
        @input="handleInput"
      >
    </label>
    <label class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/60">
      {{ t('filters.base') }}
      <input
        :value="basePath"
        readonly
        class="rounded-lg border border-amber-900/10 bg-white/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-100/10 dark:bg-slate-900/80 dark:text-amber-50"
      >
    </label>
  </section>
</template>
