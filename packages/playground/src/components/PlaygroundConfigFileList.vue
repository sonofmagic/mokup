<script setup lang="ts">
import type { PlaygroundConfigFile } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { openInEditor, resolveEditorUrl } from '../utils/editor'
import { buildHighlightParts, extractSearchValues } from '../utils/search'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  entries: PlaygroundConfigFile[]
  selectedConfig?: PlaygroundConfigFile | null | undefined
  search: string
  selectedRowClass: string
  workspaceRoot?: string | undefined
}>()

const emit = defineEmits<{
  (event: 'select-config', entry: PlaygroundConfigFile): void
}>()

const { t } = useI18n()
const highlightTokens = computed(() => extractSearchValues(props.search))

function highlightParts(text: string) {
  return buildHighlightParts(text.toLowerCase(), highlightTokens.value)
}

function isSelectedConfig(entry: PlaygroundConfigFile) {
  return props.selectedConfig?.file === entry.file
}

function resolveEditorUrlForFile(file: string) {
  return resolveEditorUrl(file, props.workspaceRoot)
}

function openInEditorForFile(file: string) {
  openInEditor(file, props.workspaceRoot)
}
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <button
      v-for="entry in props.entries"
      :key="entry.file"
      class="rounded border px-3 py-1 text-left text-xs transition border-pg-border bg-pg-surface-soft text-pg-text-soft hover:bg-pg-hover-strong hover:text-pg-text"
      :class="isSelectedConfig(entry) ? props.selectedRowClass : ''"
      type="button"
      @click="emit('select-config', entry)"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-col gap-1">
          <span class="text-[0.75rem] font-medium text-pg-text-strong">
            <template v-for="(part, index) in highlightParts(entry.file)" :key="`${entry.file}-${index}`">
              <span :class="part.highlight ? 'pg-highlight' : ''">{{ part.text }}</span>
            </template>
          </span>
        </div>
        <div class="flex items-center gap-2">
          <span
            v-if="isSelectedConfig(entry)"
            class="flex h-6 w-6 items-center justify-center rounded border border-pg-accent/40 bg-pg-accent/10 text-pg-accent"
            aria-hidden="true"
          >
            <span class="i-[carbon--checkmark] h-3.5 w-3.5" />
          </span>
          <UiPill tone="card" size="sm" :caps="false" tracking="none">
            {{ t('enabled.configLabel') }}
          </UiPill>
          <button
            v-if="resolveEditorUrlForFile(entry.file)"
            class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
            type="button"
            :aria-label="`Open ${entry.file} in VS Code`"
            :title="t('detail.openInVscode')"
            @click.stop="openInEditorForFile(entry.file)"
          >
            <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </button>
  </div>
</template>
