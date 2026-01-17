<script setup lang="ts">
import type { TreeMode, TreeRow } from '../types'

defineProps<{
  rows: TreeRow[]
  treeMode: TreeMode
}>()

const emit = defineEmits<{
  (event: 'update:treeMode', value: TreeMode): void
  (event: 'toggle', id: string): void
  (event: 'select', row: TreeRow): void
}>()

const methodBadge = (method: string) => `method-${method.toLowerCase()}`

function setMode(mode: TreeMode) {
  emit('update:treeMode', mode)
}

function handleRowClick(row: TreeRow) {
  if (row.kind === 'folder') {
    emit('toggle', row.id)
    return
  }
  emit('select', row)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <button
        class="rounded-full border border-amber-900/10 bg-white/70 px-3 py-1.5 text-xs uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5"
        :class="treeMode === 'file' ? 'border-amber-500/60 bg-white shadow-lg' : ''"
        @click="setMode('file')"
      >
        File
      </button>
      <button
        class="rounded-full border border-amber-900/10 bg-white/70 px-3 py-1.5 text-xs uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5"
        :class="treeMode === 'route' ? 'border-amber-500/60 bg-white shadow-lg' : ''"
        @click="setMode('route')"
      >
        Route
      </button>
    </div>
    <div class="flex flex-col gap-1">
      <button
        v-for="row in rows"
        :key="row.id"
        class="group rounded-xl border border-amber-900/10 bg-white/70 px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5"
        :class="row.selected ? 'border-amber-500/60 bg-white shadow-lg' : ''"
        :title="row.title"
        @click="handleRowClick(row)"
      >
        <div class="flex items-center gap-2" :style="{ paddingLeft: `${row.depth * 14}px` }">
          <span class="w-4 text-xs text-amber-700/60">
            {{ row.kind === 'folder' ? (row.expanded ? 'v' : '>') : '' }}
          </span>
          <span
            v-if="row.kind === 'route' && row.route"
            class="rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.2em]"
            :class="methodBadge(row.route.method)"
          >
            {{ row.route.method }}
          </span>
          <span class="text-sm text-amber-950" :class="row.kind === 'folder' ? 'font-semibold' : 'font-medium'">
            {{ row.label }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
