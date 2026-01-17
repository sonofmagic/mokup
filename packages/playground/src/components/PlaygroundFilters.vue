<script setup lang="ts">
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
</script>

<template>
  <section class="grid gap-4 lg:grid-cols-[2fr_1fr]">
    <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70">
      Search
      <input
        :value="search"
        type="search"
        class="rounded-2xl border border-amber-900/10 bg-white/70 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none transition focus:border-amber-500"
        placeholder="Filter by method, path, or file"
        @input="handleInput"
      >
    </label>
    <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70">
      Base
      <input
        :value="basePath"
        readonly
        class="rounded-2xl border border-amber-900/10 bg-white/70 px-4 py-3 text-sm text-amber-950 shadow-sm"
      >
    </label>
  </section>
</template>
