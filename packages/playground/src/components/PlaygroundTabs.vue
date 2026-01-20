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
      class="rounded-full border px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-soft"
      :class="activeGroup === 'all' ? 'bg-pg-accent text-pg-on-accent border-pg-accent shadow-sm ring-1 ring-pg-accent-ring' : ''"
      @click="emit('select', 'all')"
    >
      {{ t('tabs.overview') }}
    </button>
    <button
      v-for="group in groups"
      :key="group.key"
      class="rounded-full border px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.25em] transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-soft"
      :class="activeGroup === group.key ? 'bg-pg-accent text-pg-on-accent border-pg-accent shadow-sm ring-1 ring-pg-accent-ring' : ''"
      @click="emit('select', group.key)"
    >
      {{ group.label }}
    </button>
  </section>
</template>
