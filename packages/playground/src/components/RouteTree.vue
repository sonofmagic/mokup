<script setup lang="ts">
import type { PlaygroundRoute, TreeRow } from '../types'
import { openInEditor, resolveEditorUrl } from '../utils/editor'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  rows: TreeRow[]
  workspaceRoot?: string
  getRouteCount?: (route: PlaygroundRoute) => number
}>()

const emit = defineEmits<{
  (event: 'toggle', id: string): void
  (event: 'select', row: TreeRow): void
}>()

const methodBadge = (method: string) => `method-${method.toLowerCase()}`

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
</script>

<template>
  <div class="flex flex-col gap-1" data-testid="playground-tree">
    <div
      v-for="row in rows"
      :key="row.id"
      class="group flex items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-left transition text-pg-text hover:bg-pg-hover"
      :class="row.selected ? 'bg-pg-accent text-pg-on-accent border-pg-accent shadow-sm' : ''"
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
              :class="row.selected ? 'text-pg-on-accent-soft' : 'text-pg-text-muted'"
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
              class="rounded-full px-1.5 py-0.5 text-[0.5rem] uppercase tracking-[0.2em]"
              :class="methodBadge(row.route.method)"
            >
              {{ row.route.method }}
            </span>
            <span class="text-[0.78rem]" :class="row.kind === 'folder' ? 'font-semibold' : 'font-medium'">
              {{ row.label }}
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
