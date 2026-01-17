<script setup lang="ts">
import type { PlaygroundRoute } from '../types'
import { useI18n } from 'vue-i18n'

defineProps<{
  selected: PlaygroundRoute | null
  queryText: string
  headersText: string
  bodyText: string
  responseText: string
  responseStatus: string
  responseTime: string
}>()

const emit = defineEmits<{
  (event: 'update:queryText', value: string): void
  (event: 'update:headersText', value: string): void
  (event: 'update:bodyText', value: string): void
  (event: 'run'): void
}>()

const { t } = useI18n()
</script>

<template>
  <section class="rounded-3xl border border-amber-900/10 bg-white/70 p-6 shadow-xl dark:border-amber-100/10 dark:bg-slate-900/70">
    <div v-if="!selected" class="flex h-full flex-col items-center justify-center gap-3 text-center text-amber-800/70 dark:text-amber-100/70">
      <p class="text-xl font-display text-amber-950 dark:text-amber-50">
        {{ t('detail.selectTitle') }}
      </p>
      <p class="text-sm">
        {{ t('detail.selectHint') }}
      </p>
    </div>
    <div v-else class="flex flex-col gap-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-amber-700/70 dark:text-amber-200/70">
            {{ selected.method }}
          </p>
          <h2 class="mt-2 font-display text-3xl text-amber-950 dark:text-amber-50">
            {{ selected.url }}
          </h2>
          <p class="mt-2 text-xs text-amber-900/60 dark:text-amber-100/60">
            {{ selected.file }}
          </p>
        </div>
        <button
          class="rounded-full bg-amber-600 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white shadow-md transition hover:-translate-y-0.5 dark:bg-amber-500"
          @click="emit('run')"
        >
          {{ t('detail.run') }}
        </button>
      </div>

      <div class="grid gap-3">
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/70">
          {{ t('detail.query') }}
          <textarea
            :value="queryText"
            rows="3"
            class="rounded-2xl border border-amber-900/10 bg-white/80 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none focus:border-amber-500 dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-50"
            :placeholder="t('detail.queryPlaceholder')"
            @input="emit('update:queryText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
          />
        </label>
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/70">
          {{ t('detail.headers') }}
          <textarea
            :value="headersText"
            rows="3"
            class="rounded-2xl border border-amber-900/10 bg-white/80 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none focus:border-amber-500 dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-50"
            :placeholder="t('detail.headersPlaceholder')"
            @input="emit('update:headersText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
          />
        </label>
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/70">
          {{ t('detail.body') }}
          <textarea
            :value="bodyText"
            rows="5"
            class="rounded-2xl border border-amber-900/10 bg-white/80 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none focus:border-amber-500 dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-50"
            :placeholder="t('detail.bodyPlaceholder')"
            @input="emit('update:bodyText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
          />
        </label>
      </div>

      <div class="rounded-2xl border border-amber-900/10 bg-amber-50/70 p-4 dark:border-amber-100/10 dark:bg-slate-950/60">
        <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-700/70 dark:text-amber-100/70">
          <span>{{ responseStatus }}</span>
          <span class="text-amber-900/60 dark:text-amber-100/60">{{ responseTime }}</span>
        </div>
        <pre class="mt-3 max-h-72 overflow-auto rounded-2xl bg-white/80 p-4 text-xs text-amber-950 dark:bg-slate-900/70 dark:text-amber-50">{{ responseText }}</pre>
      </div>
    </div>
  </section>
</template>
