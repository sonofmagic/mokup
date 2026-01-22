<script setup lang="ts">
import type { TreeMode } from '../types'
import { useI18n } from 'vue-i18n'
import UiChipButton from './ui/UiChipButton.vue'

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
    <UiChipButton
      size="sm"
      :active="treeMode === 'file'"
      @click="setMode('file')"
    >
      <span class="i-[carbon--document] h-4 w-4" aria-hidden="true" />
      <span>{{ t('tree.file') }}</span>
    </UiChipButton>
    <UiChipButton
      size="sm"
      :active="treeMode === 'route'"
      @click="setMode('route')"
    >
      <span class="i-[carbon--link] h-4 w-4" aria-hidden="true" />
      <span>{{ t('tree.route') }}</span>
    </UiChipButton>
  </div>
</template>
