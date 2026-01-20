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
      class="flex items-center gap-2 rounded-full border px-3 py-1 text-[0.55rem] uppercase tracking-[0.25em] transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-soft"
      :class="treeMode === 'file' ? 'bg-pg-accent text-pg-on-accent border-pg-accent shadow-sm ring-1 ring-pg-accent-ring' : ''"
      @click="setMode('file')"
    >
      <span class="i-[carbon--document] h-4 w-4" aria-hidden="true" />
      <span>{{ t('tree.file') }}</span>
    </button>
    <button
      class="flex items-center gap-2 rounded-full border px-3 py-1 text-[0.55rem] uppercase tracking-[0.25em] transition hover:-translate-y-0.5 border-pg-border bg-pg-surface-strong text-pg-text-soft"
      :class="treeMode === 'route' ? 'bg-pg-accent text-pg-on-accent border-pg-accent shadow-sm ring-1 ring-pg-accent-ring' : ''"
      @click="setMode('route')"
    >
      <span class="i-[carbon--link] h-4 w-4" aria-hidden="true" />
      <span>{{ t('tree.route') }}</span>
    </button>
  </div>
</template>
