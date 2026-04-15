<script setup lang="ts">
import type {
  EditorView,
} from '@codemirror/view'
import type { Ref, StyleValue } from 'vue'
import type { EditorLanguage, JsonParseErrorDetail } from './code-editor-json'
import { computed, ref, toRef, useAttrs } from 'vue'
import { useCodeEditorInstance } from './useCodeEditorInstance'
import { cn } from './utils'

interface UiCodeEditorProps {
  modelValue: string
  placeholder?: string
  rows?: number
  language?: EditorLanguage
  disabled?: boolean
  showJsonFormat?: boolean
  formatLabel?: string
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<UiCodeEditorProps>(), {
  placeholder: '',
  rows: 4,
  language: 'text',
  disabled: false,
  showJsonFormat: true,
  formatLabel: 'Format JSON',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const attrs = useAttrs()
const host = ref<HTMLDivElement | null>(null)
const editor: Ref<EditorView | null> = ref(null)
const isApplyingExternal = ref(false)
const jsonError = ref<JsonParseErrorDetail | null>(null)

const isJsonLanguage = computed(() => props.language === 'json')
const canFormatJson = computed(() => isJsonLanguage.value && props.showJsonFormat && !props.disabled)
const hasJsonError = computed(() => !!jsonError.value && isJsonLanguage.value)
const jsonErrorText = computed(() => {
  const error = jsonError.value
  if (!error) {
    return ''
  }
  if (typeof error.line === 'number' && typeof error.column === 'number') {
    return `${error.message} (Ln ${error.line}, Col ${error.column})`
  }
  return error.message
})

const classes = computed(() => cn(
  'flex flex-col overflow-hidden rounded border border-pg-border bg-pg-surface-strong text-pg-text transition focus-within:border-pg-accent',
  hasJsonError.value ? 'border-pg-danger-border' : '',
  props.disabled ? 'cursor-not-allowed opacity-80' : '',
  attrs.class,
))

const editorStyle = computed<StyleValue>(() => {
  const minRows = Math.max(2, props.rows)
  const minHeight = `${(minRows * 1.45 + 1.2).toFixed(2)}rem`
  return {
    minHeight,
    ...(attrs.style as Record<string, unknown> | undefined),
  }
})

const wrapperAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs as Record<string, unknown>
  return rest
})

const { formatJson } = useCodeEditorInstance({
  host,
  editor,
  modelValue: toRef(props, 'modelValue'),
  placeholder: toRef(props, 'placeholder'),
  language: toRef(props, 'language'),
  disabled: toRef(props, 'disabled'),
  canFormatJson,
  isJsonLanguage,
  isApplyingExternal,
  jsonError,
  emit,
})
</script>

<template>
  <div
    v-bind="wrapperAttrs"
    :class="classes"
    :style="editorStyle"
  >
    <div
      v-if="canFormatJson"
      class="flex items-center border-b px-2 py-1 border-pg-border bg-pg-surface-soft"
    >
      <button
        class="rounded border px-2 py-1 text-[0.62rem] font-medium tracking-[0.08em] transition border-pg-border bg-pg-surface-card text-pg-text-muted hover:text-pg-text-soft"
        type="button"
        @click="formatJson"
      >
        {{ props.formatLabel }}
      </button>
    </div>
    <div ref="host" class="min-h-0 flex-1" />
    <div
      v-show="hasJsonError"
      class="border-t px-2 py-1 text-[0.68rem] border-pg-danger-border bg-pg-danger-bg text-pg-danger-text"
      aria-live="polite"
    >
      {{ jsonErrorText }}
    </div>
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  min-height: 100%;
  background-color: transparent;
}

:deep(.cm-scroller) {
  font-family: 'JetBrains Mono', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.45;
}

:deep(.cm-content),
:deep(.cm-gutterElement) {
  min-height: inherit;
  padding-block: 0.5rem;
}

:deep(.cm-content) {
  padding-inline: 0.75rem;
}

:deep(.cm-line) {
  padding-inline: 0;
}

:deep(.cm-focused) {
  outline: none;
}

:deep(.cm-gutters) {
  display: none;
}

:deep(.cm-placeholder) {
  color: var(--color-pg-text-muted);
}

:deep(.cm-cursor) {
  border-left-color: var(--color-pg-accent);
}

:deep(.pg-cm-error-line) {
  background-color: color-mix(in srgb, var(--color-pg-danger-bg) 65%, transparent);
}
</style>
