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

const methodBadge = (method: string) => `method-${method.toLowerCase()}`

const queryExample = '{ "q": "alpha", "page": 1 }'
const headersExample = '{ "x-mokup": "playground" }'
const bodyExample = '{ "name": "Ada" }'
</script>

<template>
  <section class="flex min-h-0 h-full flex-col gap-4">
    <div v-if="!selected" class="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-amber-900/10 bg-white/70 p-6 text-center text-amber-800/70 shadow-xl dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-100/70">
      <p class="text-xl font-display text-amber-950 dark:text-amber-50">
        {{ t('detail.selectTitle') }}
      </p>
      <p class="text-sm">
        {{ t('detail.selectHint') }}
      </p>
    </div>
    <div v-else class="flex min-h-0 h-full flex-col gap-4">
      <section class="rounded-2xl border border-amber-900/10 bg-white/70 shadow-sm dark:border-amber-100/10 dark:bg-slate-900/70">
        <div class="flex items-center justify-between border-b border-amber-900/10 px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-amber-700/70 dark:border-amber-100/10 dark:text-amber-100/70">
          <span>{{ t('detail.requestLabel') }}</span>
          <span class="truncate text-[0.65rem] normal-case tracking-normal text-amber-900/60 dark:text-amber-100/60">
            {{ selected.file }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-3 px-4 py-3">
          <span
            class="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em]"
            :class="methodBadge(selected.method)"
          >
            {{ selected.method }}
          </span>
          <input
            :value="selected.url"
            readonly
            class="min-w-[220px] flex-1 rounded-lg border border-amber-900/10 bg-white/80 px-3 py-2 text-sm text-amber-950 outline-none dark:border-amber-100/10 dark:bg-slate-900/80 dark:text-amber-50"
          >
          <button
            class="rounded-full bg-amber-600 px-4 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-white shadow-sm transition hover:-translate-y-0.5 dark:bg-amber-500"
            @click="emit('run')"
          >
            {{ t('detail.run') }}
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-2 border-t border-amber-900/10 px-4 py-3 text-[0.6rem] uppercase tracking-[0.2em] text-amber-800/70 dark:border-amber-100/10 dark:text-amber-100/70">
          <span>{{ t('detail.middlewares') }}</span>
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[0.55rem] text-amber-900 dark:bg-slate-800 dark:text-amber-100">
            {{ selected.middlewareCount ?? 0 }}
          </span>
        </div>
        <div
          v-if="selected.middlewares && selected.middlewares.length > 0"
          class="flex flex-wrap gap-2 border-t border-amber-900/10 px-4 py-3 text-xs text-amber-900 dark:border-amber-100/10 dark:text-amber-100"
        >
          <span
            v-for="middleware in selected.middlewares"
            :key="middleware"
            class="rounded-full border border-amber-900/10 bg-white/80 px-3 py-1 text-[0.6rem] dark:border-amber-100/10 dark:bg-slate-900/70"
          >
            {{ middleware }}
          </span>
        </div>
        <div class="grid gap-3 border-t border-amber-900/10 p-4 dark:border-amber-100/10 lg:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/70">
            {{ t('detail.query') }}
            <textarea
              :value="queryText"
              rows="4"
              class="rounded-lg border border-amber-900/10 bg-white/80 px-3 py-2 text-sm text-amber-950 outline-none focus:border-amber-500 dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-50"
              :placeholder="t('detail.queryPlaceholder', { json: queryExample })"
              @input="emit('update:queryText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </label>
          <label class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/70">
            {{ t('detail.headers') }}
            <textarea
              :value="headersText"
              rows="4"
              class="rounded-lg border border-amber-900/10 bg-white/80 px-3 py-2 text-sm text-amber-950 outline-none focus:border-amber-500 dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-50"
              :placeholder="t('detail.headersPlaceholder', { json: headersExample })"
              @input="emit('update:headersText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </label>
          <label class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-amber-800/70 dark:text-amber-100/70 lg:col-span-2">
            {{ t('detail.body') }}
            <textarea
              :value="bodyText"
              rows="6"
              class="rounded-lg border border-amber-900/10 bg-white/80 px-3 py-2 text-sm text-amber-950 outline-none focus:border-amber-500 dark:border-amber-100/10 dark:bg-slate-900/70 dark:text-amber-50"
              :placeholder="t('detail.bodyPlaceholder', { json: bodyExample })"
              @input="emit('update:bodyText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </label>
        </div>
      </section>

      <section class="flex min-h-[220px] flex-1 flex-col rounded-2xl border border-amber-900/10 bg-white/70 shadow-sm dark:border-amber-100/10 dark:bg-slate-900/70">
        <div class="flex items-center justify-between border-b border-amber-900/10 px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] text-amber-700/70 dark:border-amber-100/10 dark:text-amber-100/70">
          <span>{{ t('detail.responseLabel') }}</span>
          <span class="flex items-center gap-3 text-[0.65rem] normal-case tracking-normal text-amber-900/60 dark:text-amber-100/60">
            <span>{{ responseStatus }}</span>
            <span>{{ responseTime }}</span>
          </span>
        </div>
        <pre class="flex-1 min-h-0 overflow-auto rounded-b-2xl bg-white/80 p-4 text-xs text-amber-950 dark:bg-slate-900/70 dark:text-amber-50">{{ responseText }}</pre>
      </section>
    </div>
  </section>
</template>
