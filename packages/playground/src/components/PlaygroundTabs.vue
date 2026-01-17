<script setup lang="ts">
import type { PlaygroundGroup } from '../types'

defineProps<{
  groups: PlaygroundGroup[]
  activeGroup: string
}>()

const emit = defineEmits<{
  (event: 'select', key: string): void
}>()
</script>

<template>
  <section class="flex flex-wrap items-center gap-2">
    <button
      class="rounded-full border border-amber-900/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5"
      :class="activeGroup === 'all' ? 'border-amber-500/60 bg-white shadow-lg' : ''"
      @click="emit('select', 'all')"
    >
      Overview
    </button>
    <button
      v-for="group in groups"
      :key="group.key"
      class="rounded-full border border-amber-900/10 bg-white/70 px-4 py-2 text-xs uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5"
      :class="activeGroup === group.key ? 'border-amber-500/60 bg-white shadow-lg' : ''"
      @click="emit('select', group.key)"
    >
      {{ group.label }}
    </button>
  </section>
</template>
