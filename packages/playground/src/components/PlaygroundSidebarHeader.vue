<script setup lang="ts">
import type { PlaygroundGroup, TreeMode } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PlaygroundFilters from './PlaygroundFilters.vue'
import PlaygroundTabs from './PlaygroundTabs.vue'
import TreeModeToggle from './TreeModeToggle.vue'
import UiChipButton from './ui/UiChipButton.vue'
import UiField from './ui/UiField.vue'
import UiFloatingMenu from './ui/UiFloatingMenu.vue'
import UiTextInput from './ui/UiTextInput.vue'

const props = defineProps<{
  search: string
  basePath?: string
  groups: PlaygroundGroup[]
  activeGroup: string
  treeMode: TreeMode
  routeMode: 'active' | 'disabled' | 'ignored'
  enabledMode: 'api' | 'config'
  disabledMode: 'api' | 'config'
  activeTotal: number
  apiTotal: number
  disabledTotal: number
  ignoredTotal: number
  configTotal: number
  disabledApiTotal: number
  disabledConfigTotal: number
}>()

const emit = defineEmits<{
  (event: 'update:search', value: string): void
  (event: 'select-group', key: string): void
  (event: 'set-route-mode', mode: 'active' | 'disabled' | 'ignored'): void
  (event: 'set-enabled-mode', mode: 'api' | 'config'): void
  (event: 'set-disabled-mode', mode: 'api' | 'config'): void
  (event: 'update:treeMode', mode: TreeMode): void
}>()

const { t } = useI18n()

const searchModel = computed({
  get: () => props.search,
  set: value => emit('update:search', value),
})
const resolvedBasePath = computed(() => props.basePath || '/')
</script>

<template>
  <div class="relative">
    <div class="flex items-end gap-2">
      <PlaygroundFilters
        v-model:search="searchModel"
        :base-path="resolvedBasePath"
        :show-base="false"
        :compact="true"
        class="flex-1"
      />
      <div class="flex items-center gap-2">
        <UiFloatingMenu
          placement="bottom-start"
          :offset="8"
          panel-class="z-30 mt-1 w-[min(420px,calc(100vw-2rem))] rounded border p-2 border-pg-border bg-pg-surface-panel shadow-md"
        >
          <template #trigger="{ isOpen, panelId, toggle, setReference }">
            <UiChipButton
              :ref="setReference"
              size="sm"
              class="h-[34px]"
              :aria-expanded="isOpen"
              aria-haspopup="menu"
              :aria-controls="panelId"
              @click="toggle"
            >
              <span class="i-[carbon--settings-adjust] h-3.5 w-3.5" aria-hidden="true" />
              <span>{{ t('controls.more') }}</span>
            </UiChipButton>
          </template>
          <div class="grid gap-3">
            <UiField :label="t('filters.base')" dense>
              <UiTextInput
                :value="resolvedBasePath"
                readonly
                dense
              />
            </UiField>
            <PlaygroundTabs :groups="props.groups" :active-group="props.activeGroup" @select="emit('select-group', $event)" />
            <TreeModeToggle :tree-mode="props.treeMode" @update:treeMode="emit('update:treeMode', $event)" />
          </div>
        </UiFloatingMenu>
        <slot name="actions" />
      </div>
    </div>
    <div class="mt-2 flex items-center gap-5 border-b border-pg-border text-[0.65rem] tracking-[0.1em]">
      <button
        type="button"
        class="border-b-2 pb-1.5 transition"
        :class="props.routeMode === 'active'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="emit('set-route-mode', 'active')"
      >
        {{ t('disabled.active', { count: props.activeTotal }) }}
      </button>
      <button
        type="button"
        class="border-b-2 pb-1.5 transition"
        :class="props.routeMode === 'disabled'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="emit('set-route-mode', 'disabled')"
      >
        {{ t('disabled.disabled', { count: props.disabledTotal }) }}
      </button>
      <button
        type="button"
        class="border-b-2 pb-1.5 transition"
        :class="props.routeMode === 'ignored'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="emit('set-route-mode', 'ignored')"
      >
        {{ t('disabled.ignored', { count: props.ignoredTotal }) }}
      </button>
    </div>
    <div
      v-if="props.routeMode === 'active'"
      class="mt-1.5 flex items-center gap-4 text-[0.6rem] tracking-[0.08em]"
    >
      <button
        type="button"
        class="border-b pb-1 transition"
        :class="props.enabledMode === 'api'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="emit('set-enabled-mode', 'api')"
      >
        {{ t('enabled.api', { count: props.apiTotal }) }}
      </button>
      <button
        type="button"
        class="border-b pb-1 transition"
        :class="props.enabledMode === 'config'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="emit('set-enabled-mode', 'config')"
      >
        {{ t('enabled.config', { count: props.configTotal }) }}
      </button>
    </div>
    <div
      v-else-if="props.routeMode === 'disabled'"
      class="mt-1.5 flex items-center gap-4 text-[0.6rem] tracking-[0.08em]"
    >
      <button
        type="button"
        class="border-b pb-1 transition"
        :class="props.disabledMode === 'api'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="emit('set-disabled-mode', 'api')"
      >
        {{ t('enabled.api', { count: props.disabledApiTotal }) }}
      </button>
      <button
        type="button"
        class="border-b pb-1 transition"
        :class="props.disabledMode === 'config'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="emit('set-disabled-mode', 'config')"
      >
        {{ t('enabled.config', { count: props.disabledConfigTotal }) }}
      </button>
    </div>
  </div>
</template>
