<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import RouteTable from '../components/RouteTable.vue'
import { allRoutes, routeSections } from '../data/mock-routes'

const activeCount = computed(() => allRoutes.filter(route => !route.disabled).length)
const featureCount = computed(() => {
  const set = new Set<string>()
  for (const route of allRoutes) {
    for (const feature of route.features) {
      set.add(feature)
    }
  }
  return set.size
})

const sectionSummary = computed(() =>
  routeSections.map(section => ({
    id: section.id,
    title: section.title,
    description: section.description,
    count: section.routes.length,
  })),
)
</script>

<template>
  <section class="grid gap-12">
    <div class="glass panel-glow rise-in rounded-3xl p-10" style="animation-delay: 0.05s">
      <p class="text-xs uppercase tracking-[0.4em] text-slate-400">
        Mock Flight Overview
      </p>
      <h1 class="mt-4 font-display text-4xl text-slate-100 md:text-5xl">
        Everything mokup can do,
        <span class="text-sky-300">mapped to routes.</span>
      </h1>
      <p class="mt-4 max-w-2xl text-base text-slate-300">
        This demo app showcases every mock capability: JSON/JSONC parsing, route
        mapping by file name, multiple directories, filters, delays, headers,
        status codes, and response functions.
      </p>
      <div class="mt-8 grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
            Active routes
          </p>
          <p class="mt-2 font-display text-3xl text-slate-100">
            {{ activeCount }}
          </p>
        </div>
        <div class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
            Capabilities
          </p>
          <p class="mt-2 font-display text-3xl text-slate-100">
            {{ featureCount }}
          </p>
        </div>
        <div class="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-500">
            Mock dirs
          </p>
          <p class="mt-2 font-display text-3xl text-slate-100">
            3
          </p>
        </div>
      </div>
    </div>

    <div class="rise-in grid gap-6 md:grid-cols-3" style="animation-delay: 0.15s">
      <div
        v-for="section in sectionSummary"
        :key="section.id"
        class="glass rounded-3xl p-6"
      >
        <h2 class="font-display text-xl text-slate-100">
          {{ section.title }}
        </h2>
        <p class="mt-2 text-sm text-slate-400">
          {{ section.description }}
        </p>
        <p class="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
          {{ section.count }} routes
        </p>
      </div>
    </div>

    <div class="rise-in grid gap-6" style="animation-delay: 0.22s">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="font-display text-2xl text-slate-100">
            Route inventory
          </h2>
          <p class="text-sm text-slate-400">
            Every mock route and its defining feature.
          </p>
        </div>
        <RouterLink
          to="/playground"
          class="rounded-full border border-sky-400/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky-200 transition hover:bg-sky-400/10"
        >
          Open playground
        </RouterLink>
      </div>
      <RouteTable :routes="allRoutes" />
    </div>

    <div class="glass rise-in rounded-3xl p-6" style="animation-delay: 0.3s">
      <h2 class="font-display text-xl text-slate-100">
        Hot reload drill
      </h2>
      <p class="mt-2 text-sm text-slate-400">
        Edit <code class="font-mono">apps/web/mock/heartbeat.get.json</code> and
        re-run the request on the playground. The response should update without
        restarting Vite.
      </p>
    </div>
  </section>
</template>
