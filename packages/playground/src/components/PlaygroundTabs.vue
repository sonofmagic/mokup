<script setup lang="ts">
import type { PlaygroundGroup } from '../types'
import { useI18n } from 'vue-i18n'

defineProps<{
  groups: PlaygroundGroup[]
  activeGroup: string
}>()

const emit = defineEmits<{
  (event: 'select', key: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <section class="flex flex-wrap items-center gap-2">
    <button
      class="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100"
      :class="activeGroup === 'all' ? '!border-sky-500 !bg-sky-500 !text-white shadow-sm ring-1 ring-sky-300/60 dark:!border-sky-400 dark:!bg-sky-400' : ''"
      @click="emit('select', 'all')"
    >
      {{ t('tabs.overview') }}
    </button>
    <button
      v-for="group in groups"
      :key="group.key"
      class="rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100"
      :class="activeGroup === group.key ? '!border-sky-500 !bg-sky-500 !text-white shadow-sm ring-1 ring-sky-300/60 dark:!border-sky-400 dark:!bg-sky-400' : ''"
      @click="emit('select', group.key)"
    >
      {{ group.label }}
    </button>
  </section>
</template>
