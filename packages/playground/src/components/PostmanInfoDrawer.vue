<script setup lang="ts">
import type { PlaygroundRoute } from '../types'
import { useI18n } from 'vue-i18n'
import RouteDetailConfigChain from './RouteDetailConfigChain.vue'
import RouteDetailMiddlewares from './RouteDetailMiddlewares.vue'

const props = defineProps<{
  open: boolean
  selected: PlaygroundRoute
  workspaceRoot: string
  configStatusMap: Map<string, 'enabled' | 'disabled'>
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const { t } = useI18n()
</script>

<template>
  <Transition name="pg-info">
    <div v-if="props.open" class="absolute inset-0 z-30">
      <button
        class="pg-info-backdrop absolute inset-0 bg-black/10"
        type="button"
        aria-label="Close"
        @click="emit('close')"
      />
      <aside
        class="pg-info-panel absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l shadow-xl border-pg-border bg-pg-surface-panel"
      >
        <div class="flex items-center justify-between border-b px-4 py-3 border-pg-border">
          <div class="flex flex-col gap-1">
            <span class="text-[0.6rem] uppercase tracking-[0.25em] text-pg-text-muted">
              {{ t('detail.infoTitle') }}
            </span>
            <span class="text-xs text-pg-text-subtle">
              {{ props.selected.file }}
            </span>
          </div>
          <button
            class="rounded-full border p-2 transition border-pg-border bg-pg-surface-strong text-pg-text-muted hover:text-pg-text-soft"
            type="button"
            @click="emit('close')"
          >
            <span class="i-[carbon--close] h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div class="flex-1 overflow-auto">
          <RouteDetailConfigChain
            :config-chain="props.selected.configChain"
            :config-status-map="props.configStatusMap"
          />
          <RouteDetailMiddlewares
            :selected="props.selected"
            :workspace-root="props.workspaceRoot"
          />
        </div>
      </aside>
    </div>
  </Transition>
</template>
