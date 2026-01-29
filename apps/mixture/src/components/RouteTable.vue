<script setup lang="ts">
import type { RouteSpec } from '../data/mock-routes'

const props = defineProps<{ routes: RouteSpec[] }>()

const methodTone: Record<string, string> = {
  GET: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
  POST: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
  PATCH: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
}

function badgeClass(method: string) {
  return methodTone[method] ?? 'bg-slate-700/30 text-slate-200 border-slate-500/40'
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/40">
    <div class="grid grid-cols-[120px_1fr_1fr] gap-4 border-b border-slate-800/70 px-6 py-4 text-xs uppercase tracking-[0.2em] text-slate-400">
      <span>Method</span>
      <span>Path</span>
      <span>Source</span>
    </div>
    <div class="divide-y divide-slate-800/60">
      <div
        v-for="route in props.routes"
        :key="route.id"
        class="grid grid-cols-[120px_1fr_1fr] items-start gap-4 px-6 py-4 text-sm"
        :data-testid="`route-row-${route.id}`"
      >
        <span
          class="inline-flex items-center justify-center rounded-full border px-3 py-1 font-display text-xs"
          :class="badgeClass(route.method)"
        >
          {{ route.method }}
        </span>
        <div>
          <p class="font-display text-base text-slate-100">
            {{ route.path }}
          </p>
          <p class="text-xs text-slate-400">
            {{ route.description }}
          </p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="feature in route.features"
              :key="feature"
              class="rounded-full border border-slate-700/70 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.2em] text-slate-400"
            >
              {{ feature }}
            </span>
          </div>
        </div>
        <div class="text-xs text-slate-400">
          <p>{{ route.source }}</p>
          <p v-if="route.disabled" class="mt-2 text-rose-300">
            Filtered / disabled
          </p>
          <p v-if="route.note" class="mt-2 text-slate-500">
            {{ route.note }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
