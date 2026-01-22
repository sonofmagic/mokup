<script setup lang="ts">
import type { ThemeMode, ThemeValue } from '../utils/theme'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiChipButton from './ui/UiChipButton.vue'
import UiPill from './ui/UiPill.vue'

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
  <header class="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4 shadow-sm border-pg-border bg-pg-surface-shell">
    <div class="flex min-w-0 items-center gap-4">
      <div>
        <p class="text-[0.6rem] uppercase tracking-[0.35em] text-pg-text-subtle">
          Mokup
        </p>
        <h1 class="mt-1 font-display text-lg text-pg-text-strong">
          {{ t('header.title') }}
        </h1>
      </div>
      <p class="hidden max-w-lg text-xs text-pg-text-subtle lg:block">
        {{ t('header.subtitle') }}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <UiChipButton
        tone="card"
        size="lg"
        :title="t('header.languageToggle')"
        @click="emit('toggle-locale')"
      >
        <span class="i-[carbon--language] h-4 w-4" aria-hidden="true" />
        <span>{{ localeLabel }}</span>
      </UiChipButton>
      <UiChipButton
        tone="card"
        size="lg"
        :title="t('header.themeToggle')"
        @click="emit('toggle-theme')"
      >
        <span :class="themeIcon" class="h-4 w-4" aria-hidden="true" />
        <span>{{ themeLabel }}</span>
      </UiChipButton>
      <UiChipButton
        tone="card"
        size="lg"
        @click="emit('refresh')"
      >
        <span class="i-[carbon--rotate] h-4 w-4" aria-hidden="true" />
        <span>{{ t('header.refresh') }}</span>
      </UiChipButton>
      <UiPill tone="card" size="lg">
        <span class="i-[carbon--map] h-4 w-4" aria-hidden="true" />
        <span>{{ t('header.routes', { count: routeCount }) }}</span>
      </UiPill>
    </div>
  </header>
</template>
