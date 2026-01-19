<script setup lang="ts">
import type { TreeMode } from '../types'
import { useI18n } from 'vue-i18n'

defineProps<{
  treeMode: TreeMode
}>()

const emit = defineEmits<{
  (event: 'update:treeMode', value: TreeMode): void
}>()

function setMode(mode: TreeMode) {
  emit('update:treeMode', mode)
}

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      class="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-[0.55rem] uppercase tracking-[0.25em] text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100"
      :class="treeMode === 'file' ? '!border-sky-500 !bg-sky-500 !text-white shadow-sm ring-1 ring-sky-300/60 dark:!border-sky-400 dark:!bg-sky-400' : ''"
      @click="setMode('file')"
    >
      <span class="i-[carbon--document] h-4 w-4" aria-hidden="true" />
      <span>{{ t('tree.file') }}</span>
    </button>
    <button
      class="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-[0.55rem] uppercase tracking-[0.25em] text-slate-700 transition hover:-translate-y-0.5 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-100"
      :class="treeMode === 'route' ? '!border-sky-500 !bg-sky-500 !text-white shadow-sm ring-1 ring-sky-300/60 dark:!border-sky-400 dark:!bg-sky-400' : ''"
      @click="setMode('route')"
    >
      <span class="i-[carbon--link] h-4 w-4" aria-hidden="true" />
      <span>{{ t('tree.route') }}</span>
    </button>
  </div>
</template>
