<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface PlaygroundRoute {
  method: string
  url: string
  file: string
  type: 'handler' | 'static'
  status?: number
  delay?: number
}

interface PlaygroundResponse {
  basePath: string
  count: number
  routes: PlaygroundRoute[]
}

declare global {
  interface Window {
    __MOKUP_PLAYGROUND__?: {
      reloadRoutes?: () => void
    }
  }
}

const routes = ref<PlaygroundRoute[]>([])
const filtered = ref<PlaygroundRoute[]>([])
const selected = ref<PlaygroundRoute | null>(null)
const loading = ref(false)
const error = ref('')

const search = ref('')
const queryText = ref('')
const headersText = ref('')
const bodyText = ref('')
const responseText = ref('No response yet.')
const responseStatus = ref('Idle')
const responseTime = ref('')

const basePath = ref('')

const routesEndpoint = computed(() => {
  const base = basePath.value || ''
  return `${base}/routes`
})

const routeCount = computed(() => filtered.value.length)

function normalizeBasePath(pathname: string) {
  const trimmed = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  return trimmed.endsWith('/index.html')
    ? trimmed.slice(0, -'/index.html'.length)
    : trimmed
}

function parseJsonInput(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return { value: undefined as Record<string, unknown> | undefined }
  }
  try {
    return { value: JSON.parse(trimmed) as Record<string, unknown> }
  }
  catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid JSON' }
  }
}

function applyQuery(url: URL, query: Record<string, unknown>) {
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'undefined') {
      continue
    }
    if (Array.isArray(value)) {
      value.forEach(item => url.searchParams.append(key, String(item)))
    }
    else {
      url.searchParams.set(key, String(value))
    }
  }
}

function applyFilter() {
  const term = search.value.trim().toLowerCase()
  filtered.value = term
    ? routes.value.filter(route =>
        `${route.method} ${route.url} ${route.file}`.toLowerCase().includes(term),
      )
    : [...routes.value]
}

function routeKey(route: PlaygroundRoute) {
  return `${route.method} ${route.url}`
}

function selectRoute(route: PlaygroundRoute) {
  selected.value = route
  responseText.value = 'No response yet.'
  responseStatus.value = 'Idle'
  responseTime.value = ''
}

async function loadRoutes() {
  loading.value = true
  error.value = ''
  const previousKey = selected.value ? routeKey(selected.value) : ''
  try {
    const response = await fetch(routesEndpoint.value)
    if (!response.ok) {
      throw new Error(`Failed to load routes: ${response.status}`)
    }
    const data = await response.json() as PlaygroundResponse
    routes.value = data.routes ?? []
    applyFilter()
    if (previousKey) {
      const match = routes.value.find(route => routeKey(route) === previousKey)
      selected.value = match ?? filtered.value[0] ?? null
    }
    else {
      selected.value = filtered.value[0] ?? null
    }
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  }
  finally {
    loading.value = false
  }
}

async function runRequest() {
  if (!selected.value) {
    return
  }
  const parsedQuery = parseJsonInput(queryText.value)
  if (parsedQuery.error) {
    responseText.value = `Query JSON error: ${parsedQuery.error}`
    return
  }
  const parsedHeaders = parseJsonInput(headersText.value)
  if (parsedHeaders.error) {
    responseText.value = `Headers JSON error: ${parsedHeaders.error}`
    return
  }
  const parsedBody = parseJsonInput(bodyText.value)
  if (parsedBody.error) {
    responseText.value = `Body JSON error: ${parsedBody.error}`
    return
  }

  const url = new URL(selected.value.url, window.location.origin)
  if (parsedQuery.value) {
    applyQuery(url, parsedQuery.value)
  }

  const headers: Record<string, string> = {}
  if (parsedHeaders.value) {
    for (const [key, value] of Object.entries(parsedHeaders.value)) {
      if (typeof value === 'undefined') {
        continue
      }
      headers[key] = Array.isArray(value) ? value.join(',') : String(value)
    }
  }

  const init: RequestInit = {
    method: selected.value.method,
    headers,
  }

  const upperMethod = selected.value.method.toUpperCase()
  if (parsedBody.value && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
    init.body = JSON.stringify(parsedBody.value)
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
  }

  responseStatus.value = 'Loading...'
  responseTime.value = ''
  responseText.value = 'Waiting for response...'

  const startedAt = performance.now()
  try {
    const response = await fetch(url.toString(), init)
    const duration = Math.round(performance.now() - startedAt)
    responseTime.value = `${duration}ms`
    responseStatus.value = `${response.status} ${response.statusText}`
    const contentType = response.headers.get('content-type') ?? ''
    const raw = await response.text()
    if (contentType.includes('application/json')) {
      try {
        responseText.value = JSON.stringify(JSON.parse(raw), null, 2)
      }
      catch {
        responseText.value = raw
      }
    }
    else {
      responseText.value = raw || '[empty response]'
    }
  }
  catch (err) {
    responseStatus.value = 'Error'
    responseText.value = err instanceof Error ? err.message : String(err)
  }
}

const selectedKey = computed(() => {
  if (!selected.value) {
    return ''
  }
  return routeKey(selected.value)
})

const methodBadge = (method: string) => `method-${method.toLowerCase()}`

function routeMeta(route: PlaygroundRoute) {
  const meta: string[] = []
  meta.push(route.type)
  if (typeof route.status === 'number') {
    meta.push(`status ${route.status}`)
  }
  if (typeof route.delay === 'number') {
    meta.push(`${route.delay}ms`)
  }
  return meta.join(' · ')
}

onMounted(() => {
  basePath.value = normalizeBasePath(window.location.pathname)
  window.__MOKUP_PLAYGROUND__ = {
    reloadRoutes: () => {
      loadRoutes().catch(() => undefined)
    },
  }
  loadRoutes().catch(() => undefined)
})
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,196,150,0.35),_transparent_55%),radial-gradient(circle_at_80%_20%,_rgba(120,220,205,0.25),_transparent_50%),radial-gradient(circle_at_10%_80%,_rgba(250,220,180,0.25),_transparent_55%)]">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10">
      <header class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.4em] text-amber-700/60">
            Mokup
          </p>
          <h1 class="mt-3 font-display text-4xl text-amber-950 lg:text-5xl">
            Mock Playground
          </h1>
          <p class="mt-3 max-w-xl text-sm text-amber-900/70">
            Inspect mock endpoints, craft requests, and validate responses without leaving the dev server.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-950 transition hover:-translate-y-0.5" @click="loadRoutes">
            Refresh
          </button>
          <span class="rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-950">
            {{ routeCount }} routes
          </span>
        </div>
      </header>

      <section class="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70">
          Search
          <input
            v-model="search"
            type="search"
            class="rounded-2xl border border-amber-900/10 bg-white/70 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none transition focus:border-amber-500"
            placeholder="Filter by method, path, or file"
            @input="applyFilter"
          >
        </label>
        <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70">
          Base
          <input
            :value="basePath || '/'"
            readonly
            class="rounded-2xl border border-amber-900/10 bg-white/70 px-4 py-3 text-sm text-amber-950 shadow-sm"
          >
        </label>
      </section>

      <main class="grid gap-6 lg:grid-cols-[minmax(260px,_1fr)_minmax(320px,_1.4fr)]">
        <aside class="flex flex-col gap-4">
          <div v-if="error" class="rounded-2xl border border-rose-500/40 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
            {{ error }}
          </div>
          <div v-else-if="loading" class="rounded-2xl border border-amber-900/10 bg-white/60 px-4 py-6 text-sm text-amber-700">
            Loading routes...
          </div>
          <div v-else-if="!filtered.length" class="rounded-2xl border border-amber-900/10 bg-white/60 px-4 py-6 text-sm text-amber-700">
            No routes matched.
          </div>
          <div v-else class="flex flex-col gap-3">
            <button
              v-for="(route, index) in filtered"
              :key="`${routeKey(route)}-${index}`"
              class="group rounded-2xl border border-amber-900/10 bg-white/70 px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5"
              :class="selectedKey === routeKey(route) ? 'border-amber-500/60 bg-white shadow-lg' : ''"
              @click="selectRoute(route)"
            >
              <div class="flex items-center gap-3">
                <span class="rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em]" :class="methodBadge(route.method)">
                  {{ route.method }}
                </span>
                <span class="text-sm font-semibold text-amber-950">{{ route.url }}</span>
              </div>
              <div class="mt-2 flex items-center justify-between text-xs text-amber-900/60">
                <span class="truncate">{{ route.file }}</span>
                <span class="hidden shrink-0 uppercase tracking-[0.2em] lg:inline">{{ routeMeta(route) }}</span>
              </div>
            </button>
          </div>
        </aside>

        <section class="rounded-3xl border border-amber-900/10 bg-white/70 p-6 shadow-xl">
          <div v-if="!selected" class="flex h-full flex-col items-center justify-center gap-3 text-center text-amber-800/70">
            <p class="text-xl font-display text-amber-950">
              Select a route
            </p>
            <p class="text-sm">
              Choose a route on the left to run a request.
            </p>
          </div>
          <div v-else class="flex flex-col gap-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-[0.3em] text-amber-700/70">
                  {{ selected.method }}
                </p>
                <h2 class="mt-2 font-display text-3xl text-amber-950">
                  {{ selected.url }}
                </h2>
                <p class="mt-2 text-xs text-amber-900/60">
                  {{ selected.file }}
                </p>
              </div>
              <button class="rounded-full bg-amber-600 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white shadow-md transition hover:-translate-y-0.5" @click="runRequest">
                Run
              </button>
            </div>

            <div class="grid gap-3">
              <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70">
                Query (JSON)
                <textarea
                  v-model="queryText"
                  rows="3"
                  class="rounded-2xl border border-amber-900/10 bg-white/80 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none focus:border-amber-500"
                  placeholder="{ &quot;q&quot;: &quot;alpha&quot;, &quot;page&quot;: 1 }"
                />
              </label>
              <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70">
                Headers (JSON)
                <textarea
                  v-model="headersText"
                  rows="3"
                  class="rounded-2xl border border-amber-900/10 bg-white/80 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none focus:border-amber-500"
                  placeholder="{ &quot;x-mokup&quot;: &quot;playground&quot; }"
                />
              </label>
              <label class="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-amber-800/70">
                Body (JSON)
                <textarea
                  v-model="bodyText"
                  rows="5"
                  class="rounded-2xl border border-amber-900/10 bg-white/80 px-4 py-3 text-sm text-amber-950 shadow-sm outline-none focus:border-amber-500"
                  placeholder="{ &quot;name&quot;: &quot;Ada&quot; }"
                />
              </label>
            </div>

            <div class="rounded-2xl border border-amber-900/10 bg-amber-50/70 p-4">
              <div class="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-amber-700/70">
                <span>{{ responseStatus }}</span>
                <span class="text-amber-900/60">{{ responseTime }}</span>
              </div>
              <pre class="mt-3 max-h-72 overflow-auto rounded-2xl bg-white/80 p-4 text-xs text-amber-950">{{ responseText }}</pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>
