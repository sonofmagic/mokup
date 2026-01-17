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
      class="rounded-full border border-amber-900/10 bg-white/80 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/80 dark:text-amber-50"
      :class="activeGroup === 'all' ? 'border-amber-500/70 bg-amber-50/80 text-amber-950 shadow-sm ring-1 ring-amber-300/40 dark:border-amber-300/70 dark:bg-slate-900/90 dark:text-amber-50 dark:ring-amber-200/30' : ''"
      @click="emit('select', 'all')"
    >
      {{ t('tabs.overview') }}
    </button>
    <button
      v-for="group in groups"
      :key="group.key"
      class="rounded-full border border-amber-900/10 bg-white/80 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/80 dark:text-amber-50"
      :class="activeGroup === group.key ? 'border-amber-500/70 bg-amber-50/80 text-amber-950 shadow-sm ring-1 ring-amber-300/40 dark:border-amber-300/70 dark:bg-slate-900/90 dark:text-amber-50 dark:ring-amber-200/30' : ''"
      @click="emit('select', group.key)"
    >
      {{ group.label }}
    </button>
  </section>
</template>
