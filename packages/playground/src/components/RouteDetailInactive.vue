<script setup lang="ts">
import type {
  PlaygroundDecisionStep,
  PlaygroundDisabledRoute,
  PlaygroundEffectiveConfig,
  PlaygroundIgnoredRoute,
} from '../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { openInEditor, resolveEditorUrl } from '../utils/editor'
import UiPill from './ui/UiPill.vue'

const props = defineProps<{
  mode: 'disabled' | 'ignored'
  selected: PlaygroundDisabledRoute | PlaygroundIgnoredRoute
  workspaceRoot?: string
  configStatusMap: Map<string, 'enabled' | 'disabled'>
}>()

const { t } = useI18n()

const title = computed(() => {
  return props.mode === 'ignored'
    ? t('inactive.titleIgnored')
    : t('inactive.titleDisabled')
})

const reasonLabel = computed(() => {
  if (props.mode === 'ignored') {
    return t(`ignored.reason.${props.selected.reason}`)
  }
  return t(`disabled.reason.${props.selected.reason}`)
})

const routeTitle = computed(() => {
  if (props.selected.url) {
    return props.selected.url
  }
  return props.selected.file
})

const methodBadge = (method: string) => `method-${method.toLowerCase()}`

const decisionChain = computed(() => props.selected.decisionChain ?? [])
const configChain = computed(() => props.selected.configChain ?? [])
const configItems = computed(() => {
  return configChain.value.map((file, index) => ({
    file,
    order: index + 1,
    disabled: props.configStatusMap.get(file) === 'disabled',
  }))
})

const effectiveConfig = computed(() => props.selected.effectiveConfig ?? {})
const configEntries = computed(() => {
  const entries: { key: string, label: string, value: string }[] = []
  const config = effectiveConfig.value as PlaygroundEffectiveConfig
  if (typeof config.enabled === 'boolean') {
    entries.push({ key: 'enabled', label: t('inactive.config.enabled'), value: String(config.enabled) })
  }
  if (typeof config.status === 'number') {
    entries.push({ key: 'status', label: t('inactive.config.status'), value: String(config.status) })
  }
  if (typeof config.delay === 'number') {
    entries.push({ key: 'delay', label: t('inactive.config.delay'), value: `${config.delay}ms` })
  }
  if (typeof config.ignorePrefix !== 'undefined') {
    entries.push({ key: 'ignorePrefix', label: t('inactive.config.ignorePrefix'), value: formatConfigValue(config.ignorePrefix) })
  }
  if (typeof config.include !== 'undefined') {
    entries.push({ key: 'include', label: t('inactive.config.include'), value: formatConfigValue(config.include) })
  }
  if (typeof config.exclude !== 'undefined') {
    entries.push({ key: 'exclude', label: t('inactive.config.exclude'), value: formatConfigValue(config.exclude) })
  }
  if (config.headers && Object.keys(config.headers).length > 0) {
    entries.push({ key: 'headers', label: t('inactive.config.headers'), value: formatConfigValue(config.headers) })
  }
  return entries
})

function formatConfigValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function decisionLabel(step: PlaygroundDecisionStep) {
  const map: Record<string, string> = {
    'config.enabled': t('decision.configEnabled'),
    'ignore-prefix': t('decision.ignorePrefix'),
    'file.supported': t('decision.fileSupported'),
    'filter.exclude': t('decision.filterExclude'),
    'filter.include': t('decision.filterInclude'),
    'route.derived': t('decision.routeDerived'),
    'rule.enabled': t('decision.ruleEnabled'),
  }
  return map[step.step] ?? step.step
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
            {{ title }}
          </span>
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-if="props.selected.method"
              class="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em]"
              :class="methodBadge(props.selected.method)"
            >
              {{ props.selected.method }}
            </span>
            <span class="text-lg font-display text-pg-text-strong">
              {{ routeTitle }}
            </span>
          </div>
          <span class="text-xs text-pg-text-subtle">
            {{ props.selected.file }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <UiPill tone="chip" size="sm" :caps="false">
            {{ reasonLabel }}
          </UiPill>
          <button
            v-if="resolveEditorUrlForFile(props.selected.file)"
            class="flex h-8 w-8 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
            type="button"
            :aria-label="`Open ${props.selected.file} in VS Code`"
            :title="t('detail.openInVscode')"
            @click="openInEditorForFile(props.selected.file)"
          >
            <span class="i-[carbon--launch] h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border p-4 border-pg-border bg-pg-surface-soft">
      <div class="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
        <span>{{ t('inactive.decisionChain') }}</span>
        <UiPill tone="chip" size="xxs" :caps="false">
          {{ decisionChain.length }}
        </UiPill>
      </div>
      <div v-if="decisionChain.length > 0" class="mt-3 flex flex-col gap-2 text-sm text-pg-text-soft">
        <div
          v-for="(step, index) in decisionChain"
          :key="`decision-${index}-${step.step}`"
          class="rounded-xl border px-3 py-2 border-pg-border bg-pg-surface-card"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex flex-col gap-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full border px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.2em]"
                  :class="step.result === 'pass'
                    ? 'border-pg-border bg-pg-surface-strong text-pg-text-soft'
                    : 'border-pg-danger-border bg-pg-danger-bg text-pg-danger-text'"
                >
                  {{ step.result === 'pass' ? t('inactive.pass') : t('inactive.fail') }}
                </span>
                <span class="text-[0.85rem] font-semibold text-pg-text">
                  {{ decisionLabel(step) }}
                </span>
              </div>
              <span v-if="step.detail" class="text-[0.75rem] text-pg-text-muted">
                {{ step.detail }}
              </span>
              <span v-if="step.source" class="text-[0.7rem] text-pg-text-subtle">
                {{ step.source }}
              </span>
            </div>
            <button
              v-if="step.source && resolveEditorUrlForFile(step.source)"
              class="flex h-7 w-7 items-center justify-center rounded-md transition text-pg-text-muted hover:bg-pg-hover-strong hover:text-pg-text-soft"
              type="button"
              :aria-label="`Open ${step.source} in VS Code`"
              :title="t('detail.openInVscode')"
              @click="openInEditorForFile(step.source)"
            >
              <span class="i-[carbon--launch] h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="mt-3 text-xs text-pg-text-muted">
        {{ t('inactive.decisionChainEmpty') }}
      </div>
    </div>

    <div class="rounded-2xl border p-4 border-pg-border bg-pg-surface-soft">
      <div class="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
        <span>{{ t('detail.configChain') }}</span>
        <UiPill tone="chip" size="xxs" :caps="false">
          {{ configItems.length }}
        </UiPill>
      </div>
      <div v-if="configItems.length > 0" class="mt-3 flex flex-col gap-2 text-xs text-pg-text-soft">
        <div
          v-for="item in configItems"
          :key="`config-${item.order}-${item.file}`"
          class="flex flex-wrap items-center gap-2"
        >
          <span class="rounded-full border px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.2em] border-pg-border bg-pg-surface-strong text-pg-text-soft">
            {{ item.order }}
          </span>
          <span class="text-[0.7rem] text-pg-text-subtle">
            {{ item.file }}
          </span>
          <UiPill v-if="item.disabled" tone="strong" size="xxs" :caps="false">
            {{ t('configPanel.statusDisabled') }}
          </UiPill>
        </div>
      </div>
      <div v-else class="mt-3 text-xs text-pg-text-muted">
        {{ t('detail.configChainEmpty') }}
      </div>
    </div>

    <div class="rounded-2xl border p-4 border-pg-border bg-pg-surface-soft">
      <div class="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
        <span>{{ t('inactive.effectiveConfig') }}</span>
        <UiPill tone="chip" size="xxs" :caps="false">
          {{ configEntries.length }}
        </UiPill>
      </div>
      <div v-if="configEntries.length > 0" class="mt-3 flex flex-col gap-3 text-sm text-pg-text-soft">
        <div
          v-for="entry in configEntries"
          :key="`config-entry-${entry.key}`"
          class="rounded-xl border px-3 py-2 border-pg-border bg-pg-surface-card"
        >
          <div class="text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            {{ entry.label }}
          </div>
          <div class="mt-1 text-[0.75rem] text-pg-text-soft">
            <code class="whitespace-pre-wrap">{{ entry.value }}</code>
          </div>
        </div>
      </div>
      <div v-else class="mt-3 text-xs text-pg-text-muted">
        {{ t('inactive.effectiveConfigEmpty') }}
      </div>
    </div>

    <div class="rounded-2xl border p-4 border-pg-border bg-pg-surface-soft">
      <div class="text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
        {{ t('inactive.routeSummary') }}
      </div>
      <div class="mt-3 grid gap-2 text-sm text-pg-text-soft">
        <div v-if="props.selected.method" class="flex items-center gap-2">
          <span class="text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            {{ t('inactive.summaryMethod') }}
          </span>
          <span>{{ props.selected.method }}</span>
        </div>
        <div v-if="props.selected.url" class="flex items-center gap-2">
          <span class="text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            {{ t('inactive.summaryPath') }}
          </span>
          <span>{{ props.selected.url }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[0.6rem] uppercase tracking-[0.3em] text-pg-text-muted">
            {{ t('inactive.summaryFile') }}
          </span>
          <span class="text-pg-text-subtle">
            {{ props.selected.file }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
