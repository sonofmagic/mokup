<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="grid gap-8">
    <div class="glass panel-glow rise-in rounded-3xl p-10" style="animation-delay: 0.05s">
      <p class="text-xs uppercase tracking-[0.4em] text-slate-400">
        Access denied
      </p>
      <h1 class="mt-4 font-display text-4xl text-slate-100 md:text-5xl">
        This route is not on the allowlist.
      </h1>
      <p class="mt-3 max-w-2xl text-sm text-slate-300">
        The URL you tried to open is blocked. Head back to an approved section
        or update the whitelist in the router.
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <RouterLink
          to="/"
          class="rounded-full border border-sky-400/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-sky-200 transition hover:bg-sky-400/10"
        >
          Return overview
        </RouterLink>
        <RouterLink
          to="/playground"
          class="rounded-full border border-indigo-400/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-indigo-200 transition hover:bg-indigo-400/10"
        >
          Open playground
        </RouterLink>
      </div>
    </div>

    <div class="glass rise-in rounded-3xl p-6" style="animation-delay: 0.12s">
      <h2 class="font-display text-xl text-slate-100">
        Allowed routes
      </h2>
      <p class="mt-2 text-sm text-slate-400">
        Only these paths can enter the system.
      </p>
      <ul class="mt-4 grid gap-2 text-sm text-slate-300">
        <li class="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2">
          /
        </li>
        <li class="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-2">
          /playground
        </li>
      </ul>
    </div>
  </section>
</template>
