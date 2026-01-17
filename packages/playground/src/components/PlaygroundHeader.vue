<script setup lang="ts">
defineProps<{
  routeCount: number
}>()

const emit = defineEmits<{
  (event: 'refresh'): void
}>()
</script>

<template>
  <header class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <p class="text-xs uppercase tracking-[0.4em] text-amber-700/60">
        Mokup
      </p>
      <h1 class="mt-3 font-display text-4xl text-amber-950 lg:text-5xl">
        Mock Playground
      </h1>
      <p class="mt-3 max-w-xl text-sm text-amber-900/70">
        Inspect mock endpoints, craft requests, and validate responses without leaving the dev server.
      </p>
    </div>
    <div class="flex items-center gap-3">
      <button
        class="rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-950 transition hover:-translate-y-0.5"
        @click="emit('refresh')"
      >
        Refresh
      </button>
      <span class="rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-950">
        {{ routeCount }} routes
      </span>
    </div>
  </header>
</template>
