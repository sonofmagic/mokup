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
  <section class="grid gap-4 lg:grid-cols-[2fr_1fr]">
    <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/60">
      {{ t('filters.search') }}
      <input
        :value="search"
        type="search"
        class="rounded-2xl border border-amber-900/10 bg-white/70 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none transition focus:border-amber-500 dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-50"
        :placeholder="t('filters.searchPlaceholder')"
        @input="handleInput"
      >
    </label>
    <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/60">
      {{ t('filters.base') }}
      <input
        :value="basePath"
        readonly
        class="rounded-2xl border border-amber-900/10 bg-white/70 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-50"
      >
    </label>
  </section>
</template>
