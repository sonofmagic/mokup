<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDetailPanel } from '../hooks/useDetailPanel'
import { openInEditor, resolveEditorUrl } from '../utils/editor'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  configChain?: string[]
  configStatusMap: Map<string, 'enabled' | 'disabled'>
  workspaceRoot?: string
}>()

const { t } = useI18n()
const { isOpen, toggle } = useDetailPanel('configChain')

const contentId = 'pg-config-chain-panel'

const configItems = computed(() => {
  return (props.configChain ?? []).map((file, index) => ({
    file,
    order: index + 1,
    disabled: props.configStatusMap.get(file) === 'disabled',
    editorUrl: resolveEditorUrl(file, props.workspaceRoot),
  }))
})

function handleOpenInEditor(file: string) {
  openInEditor(file, props.workspaceRoot)
}
</script>

<template>
  <div>
    <button
      type="button"
      class="group flex w-full items-center justify-between px-4 py-3 text-[0.6rem] tracking-[0.08em] transition text-pg-text-muted hover:text-pg-text-soft"
      :aria-expanded="isOpen"
      :aria-controls="contentId"
      @click="toggle"
    >
      <span class="flex flex-wrap items-center gap-2">
        <span>{{ t('detail.configChain') }}</span>
        <UiPill tone="chip" size="xxs" :caps="false">
          {{ configItems.length }}
        </UiPill>
      </span>
      <span
        class="i-[carbon--chevron-down] h-4 w-4 transition"
        :class="isOpen ? 'rotate-0' : '-rotate-90'"
        aria-hidden="true"
      />
    </button>
    <div v-if="isOpen" :id="contentId">
      <div
        v-if="configItems.length > 0"
        class="flex flex-col gap-2 border-t px-4 py-3 text-xs border-pg-border text-pg-text-soft"
      >
        <div
          v-for="item in configItems"
          :key="`config-${item.order}-${item.file}`"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="rounded border px-2 py-0.5 text-[0.55rem] tracking-[0.08em] border-pg-border bg-pg-surface-strong text-pg-text-soft">
            {{ item.order }}
          </span>
          <span class="text-[0.7rem] text-pg-text-subtle">
            {{ item.file }}
          </span>
          <button
            v-if="item.editorUrl"
            type="button"
            class="inline-flex items-center rounded border px-1.5 py-0.5 text-[0.55rem] tracking-[0.08em] transition border-pg-border bg-pg-surface-card text-pg-text-muted hover:text-pg-text-soft"
            :title="t('detail.openInVscode')"
            @click="handleOpenInEditor(item.file)"
          >
            <span class="i-[carbon--launch] h-3 w-3" aria-hidden="true" />
          </button>
          <UiPill v-if="item.disabled" tone="strong" size="xxs" :caps="false">
            {{ t('configPanel.statusDisabled') }}
          </UiPill>
        </div>
      </div>
      <div
        v-else
        class="border-t px-4 py-3 text-xs border-pg-border text-pg-text-muted"
      >
        {{ t('detail.configChainEmpty') }}
      </div>
    </div>
  </div>
</template>
