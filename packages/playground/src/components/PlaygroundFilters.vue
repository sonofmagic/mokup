<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import UiField from './ui/UiField.vue'
import UiTextInput from './ui/UiTextInput.vue'

const props = withDefaults(defineProps<{
  search: string
  basePath: string
  showBase?: boolean
  compact?: boolean
}>(), {
  showBase: true,
  compact: false,
})

const emit = defineEmits<{
  (event: 'update:search', value: string): void
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  emit('update:search', target?.value ?? '')
}

const { t } = useI18n()
</script>

<template>
  <section class="grid" :class="props.compact ? 'gap-2' : 'gap-3'">
    <UiField
      :label="t('filters.search')"
      :dense="props.compact"
    >
      <UiTextInput
        :value="search"
        type="search"
        :dense="props.compact"
        :placeholder="t('filters.searchPlaceholder')"
        data-testid="playground-search"
        @input="handleInput"
      />
    </UiField>
    <UiField
      v-if="props.showBase"
      :label="t('filters.base')"
      :dense="props.compact"
    >
      <UiTextInput
        :value="basePath"
        readonly
        :dense="props.compact"
      />
    </UiField>
  </section>
</template>
