<script setup lang="ts">
import type { TreeRow } from '../types'

defineProps<{
  rows: TreeRow[]
}>()

const emit = defineEmits<{
  (event: 'toggle', id: string): void
  (event: 'select', row: TreeRow): void
}>()

const methodBadge = (method: string) => `method-${method.toLowerCase()}`

function handleRowClick(row: TreeRow) {
  if (row.kind === 'folder') {
    emit('toggle', row.id)
    return
  }
  emit('select', row)
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <button
      v-for="row in rows"
      :key="row.id"
      class="group rounded-lg border border-transparent px-2 py-1 text-left text-slate-800 transition hover:bg-sky-50/70 dark:text-slate-100 dark:hover:bg-slate-900/70"
      :class="row.selected ? '!border-sky-500 !bg-sky-500 !text-white shadow-sm dark:!border-sky-400 dark:!bg-sky-400' : ''"
      :title="row.title"
      @click="handleRowClick(row)"
    >
      <div class="flex items-center gap-2" :style="{ paddingLeft: `${row.depth * 12}px` }">
        <span
          class="flex h-3.5 w-3.5 items-center justify-center"
          :class="row.selected ? 'text-white/90' : 'text-slate-500/70 dark:text-slate-300/70'"
        >
          <span
            v-if="row.kind === 'folder'"
            :class="row.expanded ? 'i-[carbon--chevron-down]' : 'i-[carbon--chevron-right]'"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          />
        </span>
        <span
          v-if="row.kind === 'route' && row.route"
          class="rounded-full px-1.5 py-0.5 text-[0.5rem] uppercase tracking-[0.2em]"
          :class="methodBadge(row.route.method)"
        >
          {{ row.route.method }}
        </span>
        <span class="text-[0.78rem]" :class="row.kind === 'folder' ? 'font-semibold' : 'font-medium'">
          {{ row.label }}
        </span>
      </div>
    </button>
  </div>
</template>
