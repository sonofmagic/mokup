<script setup lang="ts">
import ApiCard from '../components/ApiCard.vue'
import { routeSections } from '../data/mock-routes'
</script>

<template>
  <section class="grid gap-10">
    <div class="glass panel-glow rise-in rounded-3xl p-8" style="animation-delay: 0.05s">
      <p class="text-xs uppercase tracking-[0.4em] text-slate-400">
        Live Requests
      </p>
      <h1 class="mt-4 font-display text-4xl text-slate-100 md:text-5xl">
        Trigger every mock endpoint.
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-slate-300">
        Each card sends a real request through the Vite middleware. Modify the
        mock files and run again to feel the hot reload loop.
      </p>
    </div>

    <div class="rise-in grid gap-10" style="animation-delay: 0.15s">
      <section v-for="section in routeSections" :key="section.id" class="grid gap-6">
        <div>
          <h2 class="font-display text-2xl text-slate-100">
            {{ section.title }}
          </h2>
          <p class="text-sm text-slate-400">
            {{ section.description }}
          </p>
        </div>
        <div class="grid gap-6 lg:grid-cols-2">
          <ApiCard v-for="route in section.routes" :key="route.id" :route="route" />
        </div>
      </section>
    </div>
  </section>
</template>
