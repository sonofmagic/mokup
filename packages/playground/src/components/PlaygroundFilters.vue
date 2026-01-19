<script setup lang="ts">
import { useI18n } from 'vue-i18n'

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
    <label
      class="flex flex-col uppercase text-slate-600/70 dark:text-slate-200/60"
      :class="props.compact ? 'gap-1 text-[0.55rem] tracking-[0.25em]' : 'gap-1.5 text-[0.65rem] tracking-[0.2em]'"
    >
      {{ t('filters.search') }}
      <input
        :value="search"
        type="search"
        class="rounded-lg border border-slate-200/70 bg-white/80 text-slate-800 outline-none transition focus:border-sky-400 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-50"
        :class="props.compact ? 'px-2.5 py-1.5 text-[0.8rem]' : 'px-3 py-2 text-sm'"
        :placeholder="t('filters.searchPlaceholder')"
        @input="handleInput"
      >
    </label>
    <label
      v-if="props.showBase"
      class="flex flex-col uppercase text-slate-600/70 dark:text-slate-200/60"
      :class="props.compact ? 'gap-1 text-[0.55rem] tracking-[0.25em]' : 'gap-1.5 text-[0.65rem] tracking-[0.2em]'"
    >
      {{ t('filters.base') }}
      <input
        :value="basePath"
        readonly
        class="rounded-lg border border-slate-200/70 bg-white/80 text-slate-800 dark:border-slate-700/50 dark:bg-slate-900/80 dark:text-slate-50"
        :class="props.compact ? 'px-2.5 py-1.5 text-[0.8rem]' : 'px-3 py-2 text-sm'"
      >
    </label>
  </section>
</template>
