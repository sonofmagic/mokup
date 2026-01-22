<script setup lang="ts">
import type { PlaygroundGroup } from '../types'
import { useI18n } from 'vue-i18n'
import UiChipButton from './ui/UiChipButton.vue'

defineProps<{
  groups: PlaygroundGroup[]
  activeGroup: string
}>()

const emit = defineEmits<{
  (event: 'select', key: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <section class="flex flex-wrap items-center gap-2">
    <UiChipButton
      size="md"
      :active="activeGroup === 'all'"
      @click="emit('select', 'all')"
    >
      {{ t('tabs.overview') }}
    </UiChipButton>
    <UiChipButton
      v-for="group in groups"
      :key="group.key"
      size="md"
      :active="activeGroup === group.key"
      @click="emit('select', group.key)"
    >
      {{ group.label }}
    </UiChipButton>
  </section>
</template>
