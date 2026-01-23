<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  responseText: string
  responseStatus: string
  responseTime: string
}>()

const { t } = useI18n()
</script>

<template>
  <section class="flex min-h-[220px] flex-1 flex-col rounded-2xl border shadow-sm border-pg-border bg-pg-surface-card">
    <div class="flex items-center justify-between border-b px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] border-pg-border text-pg-text-muted">
      <span>{{ t('detail.responseLabel') }}</span>
      <span class="flex items-center gap-3 text-[0.65rem] normal-case tracking-normal text-pg-text-subtle">
        <span>{{ props.responseStatus }}</span>
        <span>{{ props.responseTime }}</span>
      </span>
    </div>
    <pre
      class="flex-1 min-h-0 overflow-auto rounded-b-2xl p-4 text-xs bg-pg-surface-strong text-pg-text"
      data-testid="playground-response"
    >{{ props.responseText }}</pre>
  </section>
</template>
