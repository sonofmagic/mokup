<script setup lang="ts">
import type { PlaygroundRoute, RouteParamField } from '../types'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiChipButton from './ui/UiChipButton.vue'
import UiField from './ui/UiField.vue'
import UiPill from './ui/UiPill.vue'
import UiTextarea from './ui/UiTextarea.vue'
import UiTextInput from './ui/UiTextInput.vue'

type RequestTab = 'params' | 'query' | 'headers' | 'body'

const props = defineProps<{
  selected: PlaygroundRoute | null
  requestUrl: string
  workspaceRoot: string
  routeParams: RouteParamField[]
  paramValues: Record<string, string>
  queryText: string
  headersText: string
  bodyText: string
  responseText: string
  responseStatus: string
  responseTime: string
  isSwRegistering: boolean
}>()

const emit = defineEmits<{
  (event: 'update:queryText', value: string): void
  (event: 'update:headersText', value: string): void
  (event: 'update:bodyText', value: string): void
  (event: 'update:param-value', name: string, value: string): void
  (event: 'run'): void
}>()

const { t } = useI18n()

const methodBadge = (method: string) => `method-${method.toLowerCase()}`
function paramPlaceholder(param: RouteParamField) {
  return param.kind === 'param'
    ? t('detail.paramPlaceholder')
    : t('detail.paramPlaceholderCatchall')
}

function toVsCodeUrl(path: string) {
  const normalized = path.replace(/\\/g, '/')
  if (/^[a-z]:\//i.test(normalized)) {
    return `vscode://file/${encodeURI(normalized)}`
  }
  if (normalized.startsWith('/')) {
    return `vscode://file${encodeURI(normalized)}`
  }
  return `vscode://file/${encodeURI(normalized)}`
}

function resolveMiddlewareLink(source: string) {
  const trimmed = source.trim()
  if (!trimmed) {
    return ''
  }
  const normalized = trimmed.replace(/\\/g, '/')
  if (/^[a-z]:\//i.test(normalized) || normalized.startsWith('/')) {
    return toVsCodeUrl(normalized)
  }
  const root = props.workspaceRoot?.trim()
  if (!root) {
    return ''
  }
  const rootNormalized = root.replace(/\\/g, '/').replace(/\/+$/, '')
  const relative = normalized.replace(/^\/+/, '')
  return toVsCodeUrl(`${rootNormalized}/${relative}`)
}

const activeTab = ref<RequestTab>('query')

function resolveDefaultTab() {
  return props.routeParams.length > 0 ? 'params' : 'query'
}

watch(
  () => props.selected?.url ?? '',
  () => {
    activeTab.value = resolveDefaultTab()
  },
  { immediate: true },
)

watch(
  () => props.routeParams.length,
  (length, prev) => {
    if (!props.selected) {
      activeTab.value = 'query'
      return
    }
    if (length > 0 && prev === 0 && activeTab.value === 'query') {
      activeTab.value = 'params'
    }
    if (length === 0 && activeTab.value === 'params') {
      activeTab.value = 'query'
    }
  },
)

const queryExample = '{ "q": "alpha", "page": 1 }'
const headersExample = '{ "x-mokup": "playground" }'
const bodyExample = '{ "name": "Ada" }'
</script>

<template>
  <section class="flex min-h-0 flex-col gap-4">
    <div v-if="!selected" class="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border p-6 text-center shadow-xl border-pg-border bg-pg-surface-card text-pg-text-muted">
      <p class="text-xl font-display text-pg-text-strong">
        {{ t('detail.selectTitle') }}
      </p>
      <p class="text-sm">
        {{ t('detail.selectHint') }}
      </p>
    </div>
    <div v-else class="flex min-h-0 h-full flex-col gap-4">
      <section class="rounded-2xl border shadow-sm border-pg-border bg-pg-surface-card">
        <div class="flex items-center justify-between border-b px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] border-pg-border text-pg-text-muted">
          <span>{{ t('detail.requestLabel') }}</span>
          <span class="truncate text-[0.65rem] normal-case tracking-normal text-pg-text-subtle">
            {{ selected.file }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-3 px-4 py-3">
          <span
            class="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.2em]"
            :class="methodBadge(selected.method)"
          >
            {{ selected.method }}
          </span>
          <UiTextInput
            :value="requestUrl"
            readonly
            class="min-w-[220px] flex-1"
          />
          <button
            class="flex items-center gap-2 rounded-full px-4 py-2 text-[0.65rem] uppercase tracking-[0.3em] shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 bg-pg-accent text-pg-on-accent"
            data-testid="playground-run"
            :disabled="isSwRegistering"
            :aria-busy="isSwRegistering"
            @click="emit('run')"
          >
            <span
              v-if="isSwRegistering"
              class="i-[carbon--circle-dash] h-3.5 w-3.5 animate-spin"
              aria-hidden="true"
            />
            {{ t('detail.run') }}
          </button>
        </div>
        <div class="flex flex-wrap items-center gap-2 border-t px-4 py-3 text-[0.6rem] uppercase tracking-[0.2em] border-pg-border text-pg-text-muted">
          <span>{{ t('detail.middlewares') }}</span>
          <UiPill tone="chip" size="xxs" :caps="false">
            {{ selected.middlewareCount ?? 0 }}
          </UiPill>
        </div>
        <div
          v-if="selected.middlewares && selected.middlewares.length > 0"
          class="flex flex-wrap gap-2 border-t px-4 py-3 text-xs border-pg-border text-pg-text-soft"
        >
          <span
            v-for="middleware in selected.middlewares"
            :key="middleware"
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
        <div class="border-t p-4 border-pg-border">
          <div class="flex flex-wrap gap-2">
            <UiChipButton
              size="md"
              :active="activeTab === 'params'"
              @click="activeTab = 'params'"
            >
              {{ t('detail.params') }}
            </UiChipButton>
            <UiChipButton
              size="md"
              :active="activeTab === 'query'"
              @click="activeTab = 'query'"
            >
              {{ t('detail.query') }}
            </UiChipButton>
            <UiChipButton
              size="md"
              :active="activeTab === 'headers'"
              @click="activeTab = 'headers'"
            >
              {{ t('detail.headers') }}
            </UiChipButton>
            <UiChipButton
              size="md"
              :active="activeTab === 'body'"
              @click="activeTab = 'body'"
            >
              {{ t('detail.body') }}
            </UiChipButton>
          </div>
          <div class="mt-4">
            <div v-show="activeTab === 'params'">
              <div
                v-if="routeParams.length === 0"
                class="rounded-xl border px-4 py-3 text-sm border-pg-border bg-pg-surface-strong text-pg-text-muted"
              >
                {{ t('detail.emptyParams') }}
              </div>
              <div v-else class="grid gap-3 lg:grid-cols-2">
                <label
                  v-for="param in routeParams"
                  :key="param.id"
                  class="flex flex-col gap-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-pg-text-muted"
                >
                  <span class="flex items-center gap-2 text-[0.55rem] uppercase tracking-[0.2em] text-pg-text-muted">
                    <span>{{ param.name }}</span>
                    <span class="rounded-full border px-2 py-0.5 text-[0.5rem] uppercase tracking-[0.2em] border-pg-border bg-pg-surface-strong text-pg-text-soft">
                      {{ param.token }}
                    </span>
                  </span>
                  <UiTextInput
                    :value="paramValues[param.name] ?? ''"
                    :placeholder="paramPlaceholder(param)"
                    @input="emit('update:param-value', param.name, ($event.target as HTMLInputElement | null)?.value ?? '')"
                  />
                </label>
              </div>
            </div>
            <div v-show="activeTab === 'query'">
              <UiField :label="t('detail.query')">
                <UiTextarea
                  :value="queryText"
                  rows="4"
                  :placeholder="t('detail.queryPlaceholder', { json: queryExample })"
                  @input="emit('update:queryText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
                />
              </UiField>
            </div>
            <div v-show="activeTab === 'headers'">
              <UiField :label="t('detail.headers')">
                <UiTextarea
                  :value="headersText"
                  rows="4"
                  :placeholder="t('detail.headersPlaceholder', { json: headersExample })"
                  @input="emit('update:headersText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
                />
              </UiField>
            </div>
            <div v-show="activeTab === 'body'">
              <UiField :label="t('detail.body')">
                <UiTextarea
                  :value="bodyText"
                  rows="6"
                  :placeholder="t('detail.bodyPlaceholder', { json: bodyExample })"
                  @input="emit('update:bodyText', ($event.target as HTMLTextAreaElement | null)?.value ?? '')"
                />
              </UiField>
            </div>
          </div>
        </div>
      </section>

      <section class="flex min-h-[220px] flex-1 flex-col rounded-2xl border shadow-sm border-pg-border bg-pg-surface-card">
        <div class="flex items-center justify-between border-b px-4 py-3 text-[0.65rem] uppercase tracking-[0.3em] border-pg-border text-pg-text-muted">
          <span>{{ t('detail.responseLabel') }}</span>
          <span class="flex items-center gap-3 text-[0.65rem] normal-case tracking-normal text-pg-text-subtle">
            <span>{{ responseStatus }}</span>
            <span>{{ responseTime }}</span>
          </span>
        </div>
        <pre
          class="flex-1 min-h-0 overflow-auto rounded-b-2xl p-4 text-xs bg-pg-surface-strong text-pg-text"
          data-testid="playground-response"
        >{{ responseText }}</pre>
      </section>
    </div>
  </section>
</template>
