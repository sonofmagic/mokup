<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { PlaygroundGroup, TreeMode } from '../types'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PlaygroundFilters from './PlaygroundFilters.vue'
import PlaygroundTabs from './PlaygroundTabs.vue'
import TreeModeToggle from './TreeModeToggle.vue'
import UiChipButton from './ui/UiChipButton.vue'
import UiField from './ui/UiField.vue'
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

const showMore = ref(false)
const moreButtonRef = ref<ComponentPublicInstance | null>(null)
const morePanelRef = ref<HTMLDivElement | null>(null)

function toggleMore() {
  showMore.value = !showMore.value
}

function handleOutsideMoreClick(event: PointerEvent) {
  if (!showMore.value) {
    return
  }
  const target = event.target as Node | null
  if (!target) {
    return
  }
  const buttonEl = moreButtonRef.value?.$el as HTMLElement | null | undefined
  if (morePanelRef.value?.contains(target) || buttonEl?.contains(target)) {
    return
  }
  showMore.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handleOutsideMoreClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleOutsideMoreClick)
})
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
      <UiChipButton
        ref="moreButtonRef"
        size="sm"
        class="h-9"
        :aria-expanded="showMore"
        aria-haspopup="true"
        aria-controls="playground-more-panel"
        @click="toggleMore"
      >
        <span class="i-[carbon--settings-adjust] h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ t('controls.more') }}</span>
      </UiChipButton>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <UiChipButton
        size="md"
        :active="props.routeMode === 'active'"
        @click="emit('set-route-mode', 'active')"
      >
        {{ t('disabled.active', { count: props.activeTotal }) }}
      </UiChipButton>
      <UiChipButton
        size="md"
        :active="props.routeMode === 'disabled'"
        @click="emit('set-route-mode', 'disabled')"
      >
        {{ t('disabled.disabled', { count: props.disabledTotal }) }}
      </UiChipButton>
      <UiChipButton
        size="md"
        :active="props.routeMode === 'ignored'"
        @click="emit('set-route-mode', 'ignored')"
      >
        {{ t('disabled.ignored', { count: props.ignoredTotal }) }}
      </UiChipButton>
    </div>
    <div
      v-if="props.routeMode === 'active'"
      class="mt-2 flex flex-wrap items-center gap-2"
    >
      <UiChipButton
        size="sm"
        :active="props.enabledMode === 'api'"
        @click="emit('set-enabled-mode', 'api')"
      >
        {{ t('enabled.api', { count: props.apiTotal }) }}
      </UiChipButton>
      <UiChipButton
        size="sm"
        :active="props.enabledMode === 'config'"
        @click="emit('set-enabled-mode', 'config')"
      >
        {{ t('enabled.config', { count: props.configTotal }) }}
      </UiChipButton>
    </div>
    <div
      v-else-if="props.routeMode === 'disabled'"
      class="mt-2 flex flex-wrap items-center gap-2"
    >
      <UiChipButton
        size="sm"
        :active="props.disabledMode === 'api'"
        @click="emit('set-disabled-mode', 'api')"
      >
        {{ t('enabled.api', { count: props.disabledApiTotal }) }}
      </UiChipButton>
      <UiChipButton
        size="sm"
        :active="props.disabledMode === 'config'"
        @click="emit('set-disabled-mode', 'config')"
      >
        {{ t('enabled.config', { count: props.disabledConfigTotal }) }}
      </UiChipButton>
    </div>
    <div
      v-if="showMore"
      id="playground-more-panel"
      ref="morePanelRef"
      class="absolute left-0 right-0 z-30 mt-2 rounded-2xl border p-3 shadow-xl border-pg-border bg-pg-surface-panel"
    >
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
    </div>
  </div>
</template>
