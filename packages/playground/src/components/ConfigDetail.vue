<script setup lang="ts">
import type { PlaygroundConfigFile, PlaygroundConfigImpactRoute } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { openInEditor, resolveEditorUrl } from '../utils/editor'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  selected: PlaygroundConfigFile
  impacted: PlaygroundConfigImpactRoute[]
  isDisabled: boolean
  workspaceRoot?: string
}>()

const { t } = useI18n()

const scopePath = computed(() => {
  const normalized = props.selected.file.replace(/\\/g, '/')
  const index = normalized.lastIndexOf('/')
  if (index < 0) {
    return '/'
  }
  const dir = normalized.slice(0, index)
  return dir || '/'
})
const scopeLabel = computed(() => {
  if (scopePath.value === '/') {
    return '/**'
  }
  return `${scopePath.value}/**`
})

const grouped = computed(() => {
  const active: PlaygroundConfigImpactRoute[] = []
  const disabled: PlaygroundConfigImpactRoute[] = []
  const ignored: PlaygroundConfigImpactRoute[] = []
  for (const entry of props.impacted) {
    if (entry.kind === 'disabled') {
      disabled.push(entry)
    }
    else if (entry.kind === 'ignored') {
      ignored.push(entry)
    }
    else {
      active.push(entry)
    }
  }
  return { active, disabled, ignored }
})

const totalCount = computed(() => props.impacted.length)

const methodBadge = (method: string) => `method-${method.toLowerCase()}`

function formatRouteTitle(entry: PlaygroundConfigImpactRoute) {
  if (entry.url) {
    return entry.url
  }
  return entry.file
}

function resolveEditorUrlForFile(file: string) {
  return resolveEditorUrl(file, props.workspaceRoot)
}

function openInEditorForFile(file: string) {
  openInEditor(file, props.workspaceRoot)
}
</script>

<template>
  <section class="flex min-h-0 flex-col gap-4">
    <div class="rounded-3xl border p-5 shadow-xl border-pg-border bg-pg-surface-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col gap-1">
          <span class="text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            {{ t('configPanel.title') }}
          </span>
          <span class="text-lg font-display text-pg-text-strong">
            {{ props.selected.file }}
          </span>
        </div>
        <UiPill tone="chip" size="sm" :caps="false">
          {{ props.isDisabled ? t('configPanel.statusDisabled') : t('configPanel.statusEnabled') }}
        </UiPill>
      </div>
      <div class="mt-4 grid gap-3 text-sm text-pg-text-soft">
        <div class="flex items-center gap-2">
          <span class="text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            {{ t('configPanel.scope') }}
          </span>
          <span>{{ scopeLabel }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            {{ t('configPanel.impacted') }}
          </span>
          <UiPill tone="chip" size="sm" :caps="false">
            {{ totalCount }}
          </UiPill>
        </div>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-3">
      <div v-if="totalCount === 0" class="rounded-2xl border px-4 py-6 text-sm border-pg-border bg-pg-surface-soft text-pg-text-muted">
        {{ t('configPanel.emptyImpacts') }}
      </div>
      <template v-else>
        <div v-if="grouped.active.length > 0" class="rounded-2xl border p-4 border-pg-border bg-pg-surface-soft">
          <div class="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            <span>{{ t('configPanel.active') }}</span>
            <UiPill tone="chip" size="xxs" :caps="false">
              {{ grouped.active.length }}
            </UiPill>
          </div>
          <div class="mt-3 flex flex-col gap-2 text-sm text-pg-text-soft">
            <div v-for="entry in grouped.active" :key="`active-${entry.file}-${entry.method ?? ''}-${entry.url ?? ''}`" class="rounded-xl border px-3 py-2 border-pg-border bg-pg-surface-card">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    v-if="entry.method"
                    class="rounded-full px-2 py-1 text-[0.55rem] uppercase tracking-[0.2em]"
                    :class="methodBadge(entry.method)"
                  >
                    {{ entry.method }}
                  </span>
                  <span class="text-[0.75rem] font-semibold text-pg-text">
                    {{ formatRouteTitle(entry) }}
                  </span>
                </div>
                <button
                  v-if="resolveEditorUrlForFile(entry.file)"
                  class="flex h-6 w-6 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                  type="button"
                  :aria-label="`Open ${entry.file} in VS Code`"
                  :title="t('detail.openInVscode')"
                  @click="openInEditorForFile(entry.file)"
                >
                  <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <div class="mt-1 text-[0.7rem] text-pg-text-muted">
                {{ entry.file }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="grouped.disabled.length > 0" class="rounded-2xl border p-4 border-pg-border bg-pg-surface-soft">
          <div class="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            <span>{{ t('configPanel.disabled') }}</span>
            <UiPill tone="chip" size="xxs" :caps="false">
              {{ grouped.disabled.length }}
            </UiPill>
          </div>
          <div class="mt-3 flex flex-col gap-2 text-sm text-pg-text-soft">
            <div v-for="entry in grouped.disabled" :key="`disabled-${entry.file}-${entry.method ?? ''}-${entry.url ?? ''}`" class="rounded-xl border px-3 py-2 border-pg-border bg-pg-surface-card">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    v-if="entry.method"
                    class="rounded-full px-2 py-1 text-[0.55rem] uppercase tracking-[0.2em]"
                    :class="methodBadge(entry.method)"
                  >
                    {{ entry.method }}
                  </span>
                  <span class="text-[0.75rem] font-semibold text-pg-text">
                    {{ formatRouteTitle(entry) }}
                  </span>
                </div>
                <button
                  v-if="resolveEditorUrlForFile(entry.file)"
                  class="flex h-6 w-6 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                  type="button"
                  :aria-label="`Open ${entry.file} in VS Code`"
                  :title="t('detail.openInVscode')"
                  @click="openInEditorForFile(entry.file)"
                >
                  <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <div class="mt-1 text-[0.7rem] text-pg-text-muted">
                {{ entry.file }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="grouped.ignored.length > 0" class="rounded-2xl border p-4 border-pg-border bg-pg-surface-soft">
          <div class="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            <span>{{ t('configPanel.ignored') }}</span>
            <UiPill tone="chip" size="xxs" :caps="false">
              {{ grouped.ignored.length }}
            </UiPill>
          </div>
          <div class="mt-3 flex flex-col gap-2 text-sm text-pg-text-soft">
            <div v-for="entry in grouped.ignored" :key="`ignored-${entry.file}`" class="rounded-xl border px-3 py-2 border-pg-border bg-pg-surface-card">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="text-[0.75rem] font-semibold text-pg-text">
                  {{ formatRouteTitle(entry) }}
                </span>
                <button
                  v-if="resolveEditorUrlForFile(entry.file)"
                  class="flex h-6 w-6 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
                  type="button"
                  :aria-label="`Open ${entry.file} in VS Code`"
                  :title="t('detail.openInVscode')"
                  @click="openInEditorForFile(entry.file)"
                >
                  <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
