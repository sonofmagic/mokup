<script setup lang="ts">
import type { ApiResult } from '../api'

import type { RouteSpec } from '../data/mock-routes'
import { computed, ref } from 'vue'
import { useRequest } from '../api'

const props = defineProps<{ route: RouteSpec }>()

const loading = ref(false)
const result = ref<ApiResult | null>(null)
const error = ref('')

const queryText = ref(
  props.route.request?.query
    ? JSON.stringify(props.route.request.query, null, 2)
    : '',
)
const bodyText = ref(
  props.route.request?.body
    ? JSON.stringify(props.route.request.body, null, 2)
    : '',
)

const showQuery = computed(() => typeof props.route.request?.query !== 'undefined')
const showBody = computed(() => typeof props.route.request?.body !== 'undefined')

function formatData(value: unknown) {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'undefined') {
    return 'No data returned.'
  }
  return JSON.stringify(value, null, 2)
}

function parseJsonInput(input: string, label: string) {
  if (!input.trim()) {
    return { value: undefined as Record<string, unknown> | undefined }
  }
  try {
    return { value: JSON.parse(input) as Record<string, unknown> }
  }
  catch {
    return { error: `Invalid ${label} JSON.` }
  }
}

async function runRequest() {
  error.value = ''
  loading.value = true
  result.value = null
  const parsedQuery = parseJsonInput(queryText.value, 'query')
  if (parsedQuery.error) {
    error.value = parsedQuery.error
    loading.value = false
    return
  }
  const parsedBody = parseJsonInput(bodyText.value, 'body')
  if (parsedBody.error) {
    error.value = parsedBody.error
    loading.value = false
    return
  }
  try {
    result.value = await useRequest({
      method: props.route.method,
      url: props.route.path,
      params: parsedQuery.value,
      data: parsedBody.value,
      headers: props.route.request?.headers,
      responseType: props.route.request?.responseType,
    })
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
  finally {
    loading.value = false
  }
}

const statusTone = computed(() => {
  if (!result.value) {
    return 'text-slate-400'
  }
  if (result.value.status >= 500) {
    return 'text-rose-300'
  }
  if (result.value.status >= 400) {
    return 'text-amber-300'
  }
  if (result.value.status >= 300) {
    return 'text-sky-300'
  }
  return 'text-emerald-300'
})
</script>

<template>
  <article
    class="glass panel-glow rise-in flex h-full flex-col gap-5 rounded-3xl p-6"
    :class="{ 'opacity-70': route.disabled }"
    :data-testid="`api-card-${route.id}`"
  >
    <header class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">
          {{ route.title }}
        </p>
        <h3 class="mt-2 font-display text-2xl text-slate-100">
          {{ route.path }}
        </h3>
        <p class="mt-2 text-sm text-slate-400">
          {{ route.description }}
        </p>
        <p class="mt-2 text-xs text-slate-500">
          {{ route.source }}
        </p>
      </div>
      <div class="flex flex-col items-end gap-2">
        <span class="rounded-full border border-slate-600/60 px-3 py-1 text-xs uppercase tracking-[0.2em]">
          {{ route.method }}
        </span>
        <span
          v-if="route.disabled"
          class="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-rose-200"
        >
          filtered
        </span>
      </div>
    </header>

    <div class="flex flex-wrap gap-2">
      <span
        v-for="feature in route.features"
        :key="feature"
        class="rounded-full border border-slate-700/70 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-slate-400"
      >
        {{ feature }}
      </span>
    </div>

    <div v-if="route.note" class="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-3 text-xs text-slate-300">
      {{ route.note }}
    </div>

    <div v-if="showQuery" class="space-y-2">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
        Query JSON
      </p>
      <textarea
        v-model="queryText"
        rows="3"
        class="w-full rounded-2xl border border-slate-700/70 bg-slate-900/60 p-3 font-mono text-xs text-slate-200"
      />
    </div>

    <div v-if="showBody" class="space-y-2">
      <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
        Body JSON
      </p>
      <textarea
        v-model="bodyText"
        rows="4"
        class="w-full rounded-2xl border border-slate-700/70 bg-slate-900/60 p-3 font-mono text-xs text-slate-200"
      />
    </div>

    <button
      type="button"
      class="rounded-2xl border border-slate-600/70 bg-slate-900/70 px-4 py-3 text-sm uppercase tracking-[0.2em] text-slate-200 transition hover:border-sky-400/70 hover:text-sky-200"
      :disabled="loading"
      :data-testid="`api-run-${route.id}`"
      @click="runRequest"
    >
      <span v-if="loading">Running...</span>
      <span v-else>Run request</span>
    </button>

    <p v-if="error" class="text-sm text-rose-300">
      {{ error }}
    </p>

    <div class="flex flex-wrap items-center gap-4 text-xs text-slate-400">
      <span v-if="result" :class="statusTone" :data-testid="`api-status-${route.id}`">
        Status {{ result.status }} {{ result.statusText || '' }}
      </span>
      <span v-if="result">{{ result.duration }}ms</span>
      <span v-if="route.expectedStatus">Expected {{ route.expectedStatus }}</span>
      <span v-if="result && result.note">{{ result.note }}</span>
    </div>

    <div v-if="result" class="space-y-3">
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
          Headers
        </p>
        <pre class="mt-2 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 font-mono text-xs text-slate-200">{{ formatData(result.headers) }}</pre>
      </div>
      <div>
        <p class="text-xs uppercase tracking-[0.2em] text-slate-400">
          Response
        </p>
        <pre
          class="mt-2 rounded-2xl border border-slate-800/60 bg-slate-950/70 p-4 font-mono text-xs text-slate-200"
          :data-testid="`api-response-${route.id}`"
        >{{ formatData(result.data) }}</pre>
      </div>
    </div>
  </article>
</template>
