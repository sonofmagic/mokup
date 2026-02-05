<script setup lang="ts">
import type { PlaygroundRoute, TreeRow } from '../types'
import { openInEditor, resolveEditorUrl } from '../utils/editor'
import { buildHighlightParts } from '../utils/search'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  rows: TreeRow[]
  workspaceRoot?: string
  getRouteCount?: (route: PlaygroundRoute) => number
  highlightTokens?: string[]
}>()

const emit = defineEmits<{
  (event: 'toggle', id: string): void
  (event: 'select', row: TreeRow): void
}>()

function methodBadge(method: string, selected: boolean) {
  const base = `method-${method.toLowerCase()}`
  return selected ? `${base} ${base}-strong` : base
}

function resolveEditorUrlForRoute(route: PlaygroundRoute) {
  return resolveEditorUrl(route.file, props.workspaceRoot)
}

function openInEditorForRoute(route: PlaygroundRoute) {
  openInEditor(route.file, props.workspaceRoot)
}

function handleRowClick(row: TreeRow) {
  if (row.kind === 'folder') {
    emit('toggle', row.id)
    return
  }
  emit('select', row)
}

function resolveRouteCount(route: PlaygroundRoute) {
  return props.getRouteCount ? props.getRouteCount(route) : 0
}

function resolveIndent(depth: number) {
  return `${depth * 12}px`
}

function highlightParts(text: string) {
  return buildHighlightParts(text, props.highlightTokens ?? [])
}
</script>

<template>
  <div class="flex flex-col gap-0" data-testid="playground-tree">
    <div
      v-for="row in rows"
      :key="row.id"
      class="group flex min-h-[28px] items-center gap-2 rounded-lg border border-transparent px-2 py-0.5 text-left transition text-pg-text-soft hover:bg-pg-hover-strong"
      :class="row.selected ? 'bg-pg-accent/16 text-pg-text-strong border-pg-accent/50 font-semibold shadow-[inset_3px_0_0_0_var(--color-pg-accent)]' : ''"
      data-testid="playground-tree-row"
    >
      <button
        class="flex min-w-0 flex-1 items-start gap-2 text-left"
        type="button"
        :title="row.title"
        @click="handleRowClick(row)"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-center gap-2" :style="{ paddingLeft: resolveIndent(row.depth) }">
            <span
              class="flex h-3.5 w-3.5 items-center justify-center"
              :class="row.selected ? 'text-pg-accent' : 'text-pg-text-subtle'"
            >
              <span
                v-if="row.kind === 'folder'"
                :class="row.expanded ? 'i-[carbon--chevron-down]' : 'i-[carbon--chevron-right]'"
                class="h-3.5 w-3.5"
                aria-hidden="true"
              />
            </span>
            <span
              v-if="row.kind === 'route' && row.route"
              class="rounded-full border px-1.5 py-0.5 text-[0.5rem] uppercase tracking-[0.12em] leading-none transition group-hover:brightness-105"
              :class="methodBadge(row.route.method, row.selected)"
            >
              {{ row.route.method }}
            </span>
            <span
              class="text-[0.8rem] text-pg-text-strong"
              :class="row.kind === 'folder' ? 'font-semibold' : 'font-medium'"
            >
              <template v-for="(part, index) in highlightParts(row.label)" :key="`${row.id}-label-${index}`">
                <span :class="part.highlight ? 'pg-highlight' : ''">{{ part.text }}</span>
              </template>
            </span>
          </div>
        </div>
        <UiPill
          v-if="row.kind === 'route' && row.route && resolveRouteCount(row.route) > 0"
          tone="chip"
          size="xxs"
          :caps="false"
          class="ml-auto"
        >
          {{ resolveRouteCount(row.route) }}
        </UiPill>
      </button>
      <button
        v-if="row.kind === 'route' && row.route && resolveEditorUrlForRoute(row.route)"
        class="flex h-6 w-6 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
        :class="row.selected ? 'text-pg-on-accent-soft' : ''"
        type="button"
        :aria-label="`Open ${row.route.file} in VS Code`"
        @click="openInEditorForRoute(row.route)"
      >
        <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
