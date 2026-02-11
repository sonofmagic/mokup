<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

type ResponseTab = 'body' | 'headers' | 'cookies'
const props = defineProps<{
  responseText: string
  responseStatus: string
  responseTime: string
}>()

const { t } = useI18n()
const activeTab = ref<ResponseTab>('body')

const responseStatusLabel = computed(() => props.responseStatus || t('response.idle'))
const responseTimeLabel = computed(() => props.responseTime || t('response.waiting'))
const responseSizeLabel = computed(() => {
  const text = props.responseText ?? ''
  if (!text) {
    return t('response.size', { size: '0 B' })
  }
  const bytes = typeof TextEncoder === 'undefined'
    ? text.length
    : new TextEncoder().encode(text).length
  const size = bytes < 1024
    ? `${bytes} B`
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return t('response.size', { size })
})

const responseBody = computed(() => props.responseText || t('response.empty'))
</script>

<template>
  <section class="flex min-h-[240px] flex-1 flex-col rounded border border-pg-border bg-pg-surface-card">
    <div class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] border-pg-border text-pg-text-muted">
      <span>{{ t('detail.responseLabel') }}</span>
      <span class="flex flex-wrap items-center gap-3 text-[0.65rem] normal-case tracking-normal text-pg-text-subtle">
        <span>{{ responseStatusLabel }}</span>
        <span>{{ responseTimeLabel }}</span>
        <span>{{ responseSizeLabel }}</span>
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-4 border-b px-4 pt-2 text-[0.65rem] uppercase tracking-[0.25em] border-pg-border">
      <button
        type="button"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'body'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'body'"
      >
        {{ t('response.bodyTab') }}
      </button>
      <button
        type="button"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'headers'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'headers'"
      >
        {{ t('response.headersTab') }}
      </button>
      <button
        type="button"
        class="border-b-2 pb-2 transition"
        :class="activeTab === 'cookies'
          ? 'border-pg-accent text-pg-text-strong'
          : 'border-transparent text-pg-text-muted hover:text-pg-text-soft'"
        @click="activeTab = 'cookies'"
      >
        {{ t('response.cookiesTab') }}
      </button>
    </div>

    <div class="flex-1 min-h-0 overflow-auto p-4">
      <pre
        v-if="activeTab === 'body'"
        class="min-h-[140px] rounded border p-4 text-xs border-pg-border bg-pg-surface-strong text-pg-text"
        data-testid="playground-response"
      >{{ responseBody }}</pre>
      <div
        v-else-if="activeTab === 'headers'"
        class="min-h-[140px] rounded border p-4 text-sm border-pg-border bg-pg-surface-strong text-pg-text-muted"
      >
        {{ t('response.headersEmpty') }}
      </div>
      <div
        v-else
        class="min-h-[140px] rounded border p-4 text-sm border-pg-border bg-pg-surface-strong text-pg-text-muted"
      >
        {{ t('response.cookiesEmpty') }}
      </div>
    </div>
  </section>
</template>
