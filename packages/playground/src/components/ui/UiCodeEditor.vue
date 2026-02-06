<script setup lang="ts">
import type { Extension } from '@codemirror/state'
import type { StyleValue } from 'vue'
import { json } from '@codemirror/lang-json'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorSelection, EditorState } from '@codemirror/state'
import { EditorView, placeholder as placeholderExtension } from '@codemirror/view'
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'
import { cn } from './utils'

type EditorLanguage = 'text' | 'json'

interface UiCodeEditorProps {
  modelValue: string
  placeholder?: string
  rows?: number
  language?: EditorLanguage
  disabled?: boolean
}

const props = withDefaults(defineProps<UiCodeEditorProps>(), {
  placeholder: '',
  rows: 4,
  language: 'text',
  disabled: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const attrs = useAttrs()
const host = ref<HTMLDivElement | null>(null)
const editor = ref<EditorView | null>(null)
const isApplyingExternal = ref(false)

const languageCompartment = new Compartment()
const placeholderCompartment = new Compartment()
const editableCompartment = new Compartment()

const classes = computed(() => cn(
  'overflow-hidden rounded-lg border border-pg-border bg-pg-surface-strong text-pg-text transition focus-within:border-pg-accent',
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
  switch (language) {
    case 'json':
      return json()
    default:
      return []
  }
}

function createState() {
  return EditorState.create({
    doc: props.modelValue,
    extensions: [
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
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
        emit('update:modelValue', update.state.doc.toString())
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
    <div ref="host" class="h-full" />
  </div>
</template>

<style scoped>
:deep(.cm-editor) {
  height: 100%;
  background-color: transparent;
}

:deep(.cm-scroller) {
  font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
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
</style>
