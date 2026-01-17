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
      class="rounded-full border border-amber-900/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-50"
      :class="activeGroup === 'all' ? 'border-amber-500/60 bg-white shadow-lg dark:border-amber-300/60 dark:bg-slate-900/80 dark:shadow-none' : ''"
      @click="emit('select', 'all')"
    >
      {{ t('tabs.overview') }}
    </button>
    <button
      v-for="group in groups"
      :key="group.key"
      class="rounded-full border border-amber-900/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-50"
      :class="activeGroup === group.key ? 'border-amber-500/60 bg-white shadow-lg dark:border-amber-300/60 dark:bg-slate-900/80 dark:shadow-none' : ''"
      @click="emit('select', group.key)"
    >
      {{ group.label }}
    </button>
  </section>
</template>
