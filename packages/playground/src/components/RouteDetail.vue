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
  isSwRegistering: boolean
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
  <section class="flex min-h-0 flex-col gap-4">
    <div v-if="!selected" class="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border p-6 text-center shadow-xl border-pg-border bg-pg-surface-card text-pg-text-muted">
      <p class="text-xl font-display text-pg-text-strong">
        {{ t('detail.selectTitle') }}
      </p>
      <p class="text-sm">
        {{ t('detail.selectHint') }}
      </p>
    </div>
    <div v-else class="flex min-h-0 h-full flex-col gap-4">
      <section class="rounded-2xl border shadow-sm border-pg-border bg-pg-surface-card">
        <div class="flex items-center justify-between border-b px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] border-pg-border text-pg-text-muted">
          <span>{{ t('detail.requestLabel') }}</span>
          <span class="truncate text-[0.65rem] normal-case tracking-normal text-pg-text-subtle">
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
            class="min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm outline-none border-pg-border bg-pg-surface-strong text-pg-text"
          >
          <button
            class="flex items-center gap-2 rounded-full px-4 py-2 text-[0.65rem] uppercase tracking-[0.3em] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 bg-pg-accent text-pg-on-accent"
            data-testid="playground-run"
            :disabled="isSwRegistering"
            :aria-busy="isSwRegistering"
            @click="emit('run')"
          >
            <span
              v-if="isSwRegistering"
              class="i-[carbon--circle-dash] h-3.5 w-3.5 animate-spin"
              aria-hidden="true"
            />
            {{ t('detail.run') }}
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-2 border-t px-4 py-3 text-[0.6rem] uppercase tracking-[0.2em] border-pg-border text-pg-text-muted">
          <span>{{ t('detail.middlewares') }}</span>
          <span class="rounded-full px-2 py-0.5 text-[0.55rem] bg-pg-chip text-pg-chip-text">
            {{ selected.middlewareCount ?? 0 }}
          </span>
        </div>
        <div
          v-if="selected.middlewares && selected.middlewares.length > 0"
          class="flex flex-wrap gap-2 border-t px-4 py-3 text-xs border-pg-border text-pg-text-soft"
        >
          <span
            v-for="middleware in selected.middlewares"
            :key="middleware"
            class="rounded-full border px-3 py-1 text-[0.6rem] border-pg-border bg-pg-surface-strong"
          >
            {{ middleware }}
          </span>
        </div>
        <div class="grid gap-3 border-t p-4 border-pg-border lg:grid-cols-2">
          <label class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-pg-text-muted">
            {{ t('detail.query') }}
            <textarea
              :value="queryText"
              rows="4"
              class="rounded-lg border px-3 py-2 text-sm outline-none border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent"
              :placeholder="t('detail.queryPlaceholder', { json: queryExample })"
              @input="emit('update:queryText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </label>
          <label class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-pg-text-muted">
            {{ t('detail.headers') }}
            <textarea
              :value="headersText"
              rows="4"
              class="rounded-lg border px-3 py-2 text-sm outline-none border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent"
              :placeholder="t('detail.headersPlaceholder', { json: headersExample })"
              @input="emit('update:headersText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </label>
          <label class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-pg-text-muted lg:col-span-2">
            {{ t('detail.body') }}
            <textarea
              :value="bodyText"
              rows="6"
              class="rounded-lg border px-3 py-2 text-sm outline-none border-pg-border bg-pg-surface-strong text-pg-text focus:border-pg-accent"
              :placeholder="t('detail.bodyPlaceholder', { json: bodyExample })"
              @input="emit('update:bodyText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
            />
          </label>
        </div>
      </section>

      <section class="flex min-h-[220px] flex-1 flex-col rounded-2xl border shadow-sm border-pg-border bg-pg-surface-card">
        <div class="flex items-center justify-between border-b px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] border-pg-border text-pg-text-muted">
          <span>{{ t('detail.responseLabel') }}</span>
          <span class="flex items-center gap-3 text-[0.65rem] normal-case tracking-normal text-pg-text-subtle">
            <span>{{ responseStatus }}</span>
            <span>{{ responseTime }}</span>
          </span>
        </div>
        <pre
          class="flex-1 min-h-0 overflow-auto rounded-b-2xl p-4 text-xs bg-pg-surface-strong text-pg-text"
          data-testid="playground-response"
        >{{ responseText }}</pre>
      </section>
    </div>
  </section>
</template>
