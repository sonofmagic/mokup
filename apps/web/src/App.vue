<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen grid-glow bg-slate-950 text-slate-100">
    <div class="relative">
      <header class="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur">
        <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/70 font-display text-lg">
              M
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.3em] text-slate-400">
                Moku Control
              </p>
              <p class="font-display text-lg">
                Mock Operations Deck
              </p>
            </div>
          </div>
          <nav class="flex items-center gap-3">
            <RouterLink
              to="/"
              class="rounded-full border border-transparent px-4 py-2 text-sm uppercase tracking-[0.2em] text-slate-300 transition hover:border-sky-400/60 hover:text-sky-200"
              active-class="border-sky-400/70 text-sky-100"
            >
              Overview
            </RouterLink>
            <RouterLink
              to="/playground"
              class="rounded-full border border-transparent px-4 py-2 text-sm uppercase tracking-[0.2em] text-slate-300 transition hover:border-indigo-400/60 hover:text-indigo-200"
              active-class="border-indigo-400/70 text-indigo-100"
            >
              Playground
            </RouterLink>
          </nav>
        </div>
      </header>

      <main class="mx-auto w-full max-w-6xl px-6 pb-24 pt-12">
        <RouterView />
      </main>

      <footer class="border-t border-slate-800/70 px-6 py-6 text-center text-xs uppercase tracking-[0.2em] text-slate-500">
        Moku Vite mock playground - live, fast, and unapologetically local.
      </footer>
    </div>
  </div>
</template>
