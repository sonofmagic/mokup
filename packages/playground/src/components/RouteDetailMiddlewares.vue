<script setup lang="ts">
import type { PlaygroundRoute } from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDetailPanel } from '../hooks/useDetailPanel'
import { resolveEditorUrl } from '../utils/editor'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  selected: PlaygroundRoute
  workspaceRoot: string
}>()

const { t } = useI18n()
const { isOpen, toggle } = useDetailPanel('middlewares')

const contentId = 'pg-middlewares-panel'

function resolveMiddlewareLink(source: string) {
  const trimmed = source.trim()
  if (!trimmed) {
    return ''
  }
  return resolveEditorUrl(trimmed, props.workspaceRoot, {
    allowAbsoluteWithoutRoot: true,
  }) ?? ''
}

const preMiddlewares = computed(() => {
  return props.selected.preMiddlewares ?? []
})

const normalMiddlewares = computed(() => {
  if (props.selected.normalMiddlewares) {
    return props.selected.normalMiddlewares
  }
  if (props.selected.preMiddlewares || props.selected.postMiddlewares) {
    return []
  }
  return props.selected.middlewares ?? []
})

const postMiddlewares = computed(() => {
  return props.selected.postMiddlewares ?? []
})

const preCount = computed(() => {
  return props.selected.preMiddlewareCount ?? preMiddlewares.value.length
})

const normalCount = computed(() => {
  return props.selected.normalMiddlewareCount ?? normalMiddlewares.value.length
})

const postCount = computed(() => {
  return props.selected.postMiddlewareCount ?? postMiddlewares.value.length
})

const totalCount = computed(() => {
  return props.selected.middlewareCount ?? (preCount.value + normalCount.value + postCount.value)
})
</script>

<template>
  <div>
    <button
      type="button"
      class="group flex w-full items-center justify-between border-t px-4 py-3 text-[0.6rem] uppercase tracking-[0.2em] transition border-pg-border text-pg-text-muted hover:text-pg-text-soft"
      :aria-expanded="isOpen"
      :aria-controls="contentId"
      @click="toggle"
    >
      <span class="flex flex-wrap items-center gap-2">
        <span>{{ t('detail.middlewares') }}</span>
        <UiPill tone="chip" size="xxs" :caps="false">
          {{ totalCount }}
        </UiPill>
      </span>
      <span
        class="i-[carbon--chevron-down] h-4 w-4 transition"
        :class="isOpen ? 'rotate-0' : '-rotate-90'"
        aria-hidden="true"
      />
    </button>
    <div
      v-if="isOpen && (preMiddlewares.length > 0 || normalMiddlewares.length > 0 || postMiddlewares.length > 0)"
      :id="contentId"
      class="flex flex-col gap-3 border-t px-4 py-3 text-xs border-pg-border text-pg-text-soft"
    >
      <div v-if="preMiddlewares.length > 0" class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-pg-text-muted">
          <span>{{ t('detail.middlewarePre') }}</span>
          <UiPill tone="chip" size="xxs" :caps="false">
            {{ preCount }}
          </UiPill>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="middleware in preMiddlewares"
            :key="`pre-${middleware}`"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.6rem] border-pg-border bg-pg-surface-strong"
          >
            {{ middleware }}
            <a
              v-if="resolveMiddlewareLink(middleware)"
              :href="resolveMiddlewareLink(middleware)"
              class="text-pg-text-soft transition hover:text-pg-text"
              :title="t('detail.openInVscode')"
            >
              <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </span>
        </div>
      </div>
      <div v-if="normalMiddlewares.length > 0" class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-pg-text-muted">
          <span>{{ t('detail.middlewareNormal') }}</span>
          <UiPill tone="chip" size="xxs" :caps="false">
            {{ normalCount }}
          </UiPill>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="middleware in normalMiddlewares"
            :key="`normal-${middleware}`"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.6rem] border-pg-border bg-pg-surface-strong"
          >
            {{ middleware }}
            <a
              v-if="resolveMiddlewareLink(middleware)"
              :href="resolveMiddlewareLink(middleware)"
              class="text-pg-text-soft transition hover:text-pg-text"
              :title="t('detail.openInVscode')"
            >
              <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </span>
        </div>
      </div>
      <div v-if="postMiddlewares.length > 0" class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-pg-text-muted">
          <span>{{ t('detail.middlewarePost') }}</span>
          <UiPill tone="chip" size="xxs" :caps="false">
            {{ postCount }}
          </UiPill>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="middleware in postMiddlewares"
            :key="`post-${middleware}`"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.6rem] border-pg-border bg-pg-surface-strong"
          >
            {{ middleware }}
            <a
              v-if="resolveMiddlewareLink(middleware)"
              :href="resolveMiddlewareLink(middleware)"
              class="text-pg-text-soft transition hover:text-pg-text"
              :title="t('detail.openInVscode')"
            >
              <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
