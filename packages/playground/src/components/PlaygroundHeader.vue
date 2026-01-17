<script setup lang="ts">
import type { ThemeMode, ThemeValue } from '../utils/theme'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  routeCount: number
  themeMode: ThemeMode
  effectiveTheme: ThemeValue
  locale: string
}>()

const emit = defineEmits<{
  (event: 'refresh'): void
  (event: 'toggle-theme'): void
  (event: 'toggle-locale'): void
}>()

const { t } = useI18n()

const themeIcon = computed(() =>
  props.effectiveTheme === 'dark' ? 'i-[carbon--moon]' : 'i-[carbon--sun]',
)
const themeLabel = computed(() => t(`theme.${props.themeMode}`))
const localeLabel = computed(() => (props.locale === 'zh-CN' ? '中文' : 'EN'))
</script>

<template>
  <header class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
    <div>
      <p class="text-xs uppercase tracking-[0.4em] text-amber-700/60 dark:text-amber-200/60">
        Mokup
      </p>
      <h1 class="mt-3 font-display text-4xl text-amber-950 dark:text-amber-50 lg:text-5xl">
        {{ t('header.title') }}
      </h1>
      <p class="mt-3 max-w-xl text-sm text-amber-900/70 dark:text-amber-100/70">
        {{ t('header.subtitle') }}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <button
        class="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-50"
        :title="t('header.languageToggle')"
        @click="emit('toggle-locale')"
      >
        <span class="i-[carbon--language] h-4 w-4" aria-hidden="true" />
        <span>{{ localeLabel }}</span>
      </button>
      <button
        class="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-50"
        :title="t('header.themeToggle')"
        @click="emit('toggle-theme')"
      >
        <span :class="themeIcon" class="h-4 w-4" aria-hidden="true" />
        <span>{{ themeLabel }}</span>
      </button>
      <button
        class="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-950 transition hover:-translate-y-0.5 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-50"
        @click="emit('refresh')"
      >
        <span class="i-[carbon--rotate] h-4 w-4" aria-hidden="true" />
        <span>{{ t('header.refresh') }}</span>
      </button>
      <span class="flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-950 dark:border-amber-100/10 dark:bg-slate-900/60 dark:text-amber-50">
        <span class="i-[carbon--map] h-4 w-4" aria-hidden="true" />
        <span>{{ t('header.routes', { count: routeCount }) }}</span>
      </span>
    </div>
  </header>
</template>
