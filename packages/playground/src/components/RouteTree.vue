<script setup lang="ts">
import type { PlaygroundRoute, TreeRow } from '../types'
import { toPosixPath } from '../utils/path'

const props = defineProps<{
  rows: TreeRow[]
  workspaceRoot?: string
}>()

const emit = defineEmits<{
  (event: 'toggle', id: string): void
  (event: 'select', row: TreeRow): void
}>()

const methodBadge = (method: string) => `method-${method.toLowerCase()}`

function hasWorkspaceRoot() {
  return (props.workspaceRoot ?? '').trim().length > 0
}

function isAbsolutePath(value: string) {
  return value.startsWith('/') || /^[a-z]:\//i.test(value)
}

function resolveEditorPath(route: PlaygroundRoute) {
  if (!hasWorkspaceRoot()) {
    return null
  }
  const file = toPosixPath(route.file || '').trim()
  if (!file) {
    return null
  }
  if (isAbsolutePath(file)) {
    return file
  }
  const root = toPosixPath((props.workspaceRoot ?? '').trim())
  if (!root) {
    return null
  }
  const normalizedRoot = root.replace(/\/$/, '')
  const normalizedFile = file.replace(/^\/+/, '')
  return `${normalizedRoot}/${normalizedFile}`
}

function openInEditor(route: PlaygroundRoute) {
  const filePath = resolveEditorPath(route)
  if (!filePath) {
    return
  }
  const target = `vscode://file/${encodeURI(filePath)}`
  window.location.href = target
}

function handleRowClick(row: TreeRow) {
  if (row.kind === 'folder') {
    emit('toggle', row.id)
    return
  }
  emit('select', row)
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <div
      v-for="row in rows"
      :key="row.id"
      class="group flex items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-left text-slate-800 transition hover:bg-sky-50/70 dark:text-slate-100 dark:hover:bg-slate-900/70"
      :class="row.selected ? '!border-sky-500 !bg-sky-500 !text-white shadow-sm dark:!border-sky-400 dark:!bg-sky-400' : ''"
    >
      <button
        class="flex min-w-0 flex-1 items-center gap-2 text-left"
        type="button"
        :title="row.title"
        @click="handleRowClick(row)"
      >
        <div class="flex items-center gap-2" :style="{ paddingLeft: `${row.depth * 12}px` }">
          <span
            class="flex h-3.5 w-3.5 items-center justify-center"
            :class="row.selected ? 'text-white/90' : 'text-slate-500/70 dark:text-slate-300/70'"
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
      </button>
      <button
        v-if="row.kind === 'route' && row.route && resolveEditorPath(row.route)"
        class="flex h-6 w-6 items-center justify-center rounded-md text-slate-500/70 transition hover:bg-slate-200/60 hover:text-slate-700 dark:text-slate-300/70 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
        :class="row.selected ? 'text-white/90 hover:text-white' : ''"
        type="button"
        :aria-label="`Open ${row.route.file} in VS Code`"
        @click="openInEditor(row.route)"
      >
        <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
