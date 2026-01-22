<script setup lang="ts">
import type { PlaygroundLocale } from '../i18n'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlaygroundTheme } from '../hooks/usePlaygroundTheme'
import { persistLocale } from '../i18n'
import UiChipButton from './ui/UiChipButton.vue'
import UiPill from './ui/UiPill.vue'

defineProps<{
  visibleCount: number
  totalCount: number
}>()

const emit = defineEmits<{
  (event: 'refresh'): void
}>()

const { locale, t } = useI18n()
const { themeMode, effectiveTheme, cycleThemeMode } = usePlaygroundTheme()

const themeIcon = computed(() =>
  effectiveTheme.value === 'dark' ? 'i-[carbon--moon]' : 'i-[carbon--sun]',
)
const themeLabel = computed(() => t(`theme.${themeMode.value}`))
const localeLabel = computed(() => (locale.value === 'zh-CN' ? '中文' : 'EN'))

function toggleLocale() {
  const next = locale.value === 'en-US' ? 'zh-CN' : 'en-US'
  locale.value = next
  persistLocale(next as PlaygroundLocale)
}

function handleRefresh() {
  emit('refresh')
}
</script>

<template>
  <div class="flex flex-none flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-[0.55rem] uppercase tracking-[0.25em] shadow-sm border-pg-border bg-pg-surface-card text-pg-text-soft">
    <div class="flex flex-wrap items-center gap-2">
      <UiPill tone="strong" size="xs">
        <span class="i-[carbon--map] h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ t('header.routes', { count: visibleCount }) }}</span>
      </UiPill>
      <UiPill tone="strong" size="xs">
        <span class="i-[carbon--activity] h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ t('header.calls', { count: totalCount }) }}</span>
      </UiPill>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <UiChipButton
        size="xs"
        :title="t('header.languageToggle')"
        @click="toggleLocale"
      >
        <span class="i-[carbon--language] h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ localeLabel }}</span>
      </UiChipButton>
      <UiChipButton
        size="xs"
        :title="t('header.themeToggle')"
        @click="cycleThemeMode"
      >
        <span :class="themeIcon" class="h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ themeLabel }}</span>
      </UiChipButton>
      <UiChipButton
        size="xs"
        @click="handleRefresh"
      >
        <span class="i-[carbon--rotate] h-3.5 w-3.5" aria-hidden="true" />
        <span>{{ t('header.refresh') }}</span>
      </UiChipButton>
    </div>
  </div>
</template>
