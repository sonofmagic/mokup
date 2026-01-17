<script setup lang="ts">
import type { TreeMode, TreeRow } from '../types'
import { useI18n } from 'vue-i18n'

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

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-2">
      <button
        class="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/70 px-3 py-1.5 text-xs uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-50"
        :class="treeMode === 'file' ? 'border-amber-500/60 bg-white shadow-lg dark:border-amber-300/60 dark:bg-slate-900/80 dark:shadow-none' : ''"
        @click="setMode('file')"
      >
        <span class="i-[carbon--document] h-4 w-4" aria-hidden="true" />
        <span>{{ t('tree.file') }}</span>
      </button>
      <button
        class="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/70 px-3 py-1.5 text-xs uppercase tracking-[0.25em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-50"
        :class="treeMode === 'route' ? 'border-amber-500/60 bg-white shadow-lg dark:border-amber-300/60 dark:bg-slate-900/80 dark:shadow-none' : ''"
        @click="setMode('route')"
      >
        <span class="i-[carbon--link] h-4 w-4" aria-hidden="true" />
        <span>{{ t('tree.route') }}</span>
      </button>
    </div>
    <div class="flex flex-col gap-1">
      <button
        v-for="row in rows"
        :key="row.id"
        class="group rounded-xl border border-amber-900/10 bg-white/70 px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/60"
        :class="row.selected ? 'border-amber-500/60 bg-white shadow-lg dark:border-amber-300/60 dark:bg-slate-900/80 dark:shadow-none' : ''"
        :title="row.title"
        @click="handleRowClick(row)"
      >
        <div class="flex items-center gap-2" :style="{ paddingLeft: `${row.depth * 14}px` }">
          <span class="flex h-4 w-4 items-center justify-center text-amber-700/60 dark:text-amber-200/60">
            <span
              v-if="row.kind === 'folder'"
              :class="row.expanded ? 'i-[carbon--chevron-down]' : 'i-[carbon--chevron-right]'"
              class="h-4 w-4"
              aria-hidden="true"
            />
          </span>
          <span
            v-if="row.kind === 'route' && row.route"
            class="rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.2em]"
            :class="methodBadge(row.route.method)"
          >
            {{ row.route.method }}
          </span>
          <span class="text-sm text-amber-950 dark:text-amber-50" :class="row.kind === 'folder' ? 'font-semibold' : 'font-medium'">
            {{ row.label }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
