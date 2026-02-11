<script setup lang="ts">
import type { Extension } from '@codemirror/state'
import type { StyleValue } from 'vue'
import { json } from '@codemirror/lang-json'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import {
  Compartment,
  EditorSelection,
  EditorState,
  StateEffect,
  StateField,
} from '@codemirror/state'
import {
  Decoration,
  EditorView,
  placeholder as placeholderExtension,
} from '@codemirror/view'
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'
import { cn } from './utils'

type EditorLanguage = 'text' | 'json'

interface UiCodeEditorProps {
  modelValue: string
  placeholder?: string
  rows?: number
  language?: EditorLanguage
  disabled?: boolean
  showJsonFormat?: boolean
  formatLabel?: string
}

interface JsonParseErrorDetail {
  message: string
  index: number | null
  line: number | null
  column: number | null
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
const editor = ref<EditorView | null>(null)
const isApplyingExternal = ref(false)
const jsonError = ref<JsonParseErrorDetail | null>(null)

const languageCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const editableCompartment = new Compartment()

const setErrorIndexEffect = StateEffect.define<number | null>()

const errorLineField = StateField.define({
  create() {
    return Decoration.none
  },
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setErrorIndexEffect)) {
        const index = effect.value
        if (index === null) {
          return Decoration.none
        }
        const safeIndex = Math.min(
          Math.max(index, 0),
          Math.max(transaction.state.doc.length - 1, 0),
        )
        const line = transaction.state.doc.lineAt(safeIndex)
        return Decoration.set([
          Decoration.line({ class: 'pg-cm-error-line' }).range(line.from),
        ])
      }
    }
    return value.map(transaction.changes)
  },
  provide: field => EditorView.decorations.from(field),
})

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

function resolveLanguageExtension(language: EditorLanguage): Extension {
  if (language === 'json') {
    return json()
  }
  return []
}

function resolveRangeFromIndex(docLength: number, index: number) {
  if (docLength <= 0) {
    return { from: 0, to: 0 }
  }
  const safeIndex = Math.max(0, Math.min(index, docLength - 1))
  const from = safeIndex
  const to = Math.min(safeIndex + 1, docLength)
  return { from, to }
}

function resolveLineColumn(text: string, index: number) {
  let line = 1
  let column = 1
  const boundary = Math.max(0, Math.min(index, text.length))
  for (let pointer = 0; pointer < boundary; pointer += 1) {
    if (text[pointer] === '\n') {
      line += 1
      column = 1
    }
    else {
      column += 1
    }
  }
  return { line, column }
}

function resolveJsonErrorIndex(message: string, text: string) {
  const match = message.match(/position\s+(\d+)/i)
  if (match) {
    const value = Number(match[1])
    if (Number.isFinite(value)) {
      return Math.max(0, value)
    }
  }
  if (/end of json input/i.test(message)) {
    return Math.max(text.length - 1, 0)
  }
  return null
}

function parseJsonError(text: string, error: unknown): JsonParseErrorDetail {
  const message = error instanceof Error ? error.message : String(error)
  const index = resolveJsonErrorIndex(message, text)
  if (index === null) {
    return {
      message,
      index: null,
      line: null,
      column: null,
    }
  }
  const { line, column } = resolveLineColumn(text, index)
  return {
    message,
    index,
    line,
    column,
  }
}

function setEditorErrorIndex(index: number | null) {
  const view = editor.value
  if (!view) {
    return
  }
  view.dispatch({
    effects: setErrorIndexEffect.of(index),
  })
}

function validateJsonDoc(text: string, options: { focusError?: boolean } = {}) {
  if (!isJsonLanguage.value) {
    jsonError.value = null
    setEditorErrorIndex(null)
    return true
  }
  const trimmed = text.trim()
  if (!trimmed) {
    jsonError.value = null
    setEditorErrorIndex(null)
    return true
  }

  try {
    JSON.parse(text)
    jsonError.value = null
    setEditorErrorIndex(null)
    return true
  }
  catch (error) {
    const detail = parseJsonError(text, error)
    jsonError.value = detail
    setEditorErrorIndex(detail.index)
    if (options.focusError && typeof detail.index === 'number') {
      const view = editor.value
      if (view) {
        const range = resolveRangeFromIndex(view.state.doc.length, detail.index)
        view.dispatch({
          selection: EditorSelection.range(range.from, range.to),
          effects: EditorView.scrollIntoView(range.from, { y: 'center' }),
        })
      }
    }
    return false
  }
}

function formatJson() {
  if (!canFormatJson.value) {
    return
  }
  const view = editor.value
  if (!view) {
    return
  }
  const text = view.state.doc.toString()
  const trimmed = text.trim()
  if (!trimmed) {
    jsonError.value = null
    setEditorErrorIndex(null)
    return
  }

  try {
    const parsed = JSON.parse(text)
    const formatted = JSON.stringify(parsed, null, 2)
    const current = view.state.doc.toString()
    if (formatted === current) {
      jsonError.value = null
      setEditorErrorIndex(null)
      return
    }
    isApplyingExternal.value = true
    view.dispatch({
      changes: { from: 0, to: current.length, insert: formatted },
      selection: EditorSelection.cursor(formatted.length),
    })
    isApplyingExternal.value = false
    emit('update:modelValue', formatted)
    jsonError.value = null
    setEditorErrorIndex(null)
  }
  catch (error) {
    const detail = parseJsonError(text, error)
    jsonError.value = detail
    setEditorErrorIndex(detail.index)
    validateJsonDoc(text, { focusError: true })
  }
}

function createState() {
  return EditorState.create({
    doc: props.modelValue,
    extensions: [
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      errorLineField,
      EditorView.lineWrapping,
      languageCompartment.of(resolveLanguageExtension(props.language)),
      placeholderCompartment.of(
        props.placeholder
          ? placeholderExtension(props.placeholder)
          : [],
      ),
      editableCompartment.of(EditorView.editable.of(!props.disabled)),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged || isApplyingExternal.value) {
          return
        }
        const next = update.state.doc.toString()
        emit('update:modelValue', next)
        // Defer validation so we don't dispatch back into the editor
        // synchronously from within the updateListener, which can
        // trigger Vue DOM patches that steal focus.
        queueMicrotask(() => validateJsonDoc(next))
      }),
    ],
  })
}

onMounted(() => {
  if (!host.value) {
    return
  }
  editor.value = new EditorView({
    state: createState(),
    parent: host.value,
  })
  validateJsonDoc(props.modelValue)
})

watch(
  () => props.modelValue,
  (value) => {
    const view = editor.value
    if (!view) {
      return
    }
    const current = view.state.doc.toString()
    if (current === value) {
      return
    }
    isApplyingExternal.value = true
    const anchor = Math.min(view.state.selection.main.anchor, value.length)
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      selection: EditorSelection.cursor(anchor),
    })
    isApplyingExternal.value = false
    validateJsonDoc(value)
  },
)

watch(
  () => props.language,
  (value) => {
    const view = editor.value
    if (!view) {
      return
    }
    view.dispatch({
      effects: languageCompartment.reconfigure(resolveLanguageExtension(value)),
    })
    validateJsonDoc(view.state.doc.toString())
  },
)

watch(
  () => props.placeholder,
  (value) => {
    const view = editor.value
    if (!view) {
      return
    }
    view.dispatch({
      effects: placeholderCompartment.reconfigure(
        value ? placeholderExtension(value) : [],
      ),
    })
  },
)

watch(
  () => props.disabled,
  (value) => {
    const view = editor.value
    if (!view) {
      return
    }
    view.dispatch({
      effects: editableCompartment.reconfigure(EditorView.editable.of(!value)),
    })
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
  editor.value = null
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
