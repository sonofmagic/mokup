import type { Ref } from 'vue'
import type { EditorLanguage, JsonParseErrorDetail } from './code-editor-json'
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Compartment, EditorSelection, EditorState } from '@codemirror/state'
import { EditorView, placeholder as placeholderExtension } from '@codemirror/view'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import {
  errorLineField,
  parseJsonError,
  resolveLanguageExtension,
  resolveRangeFromIndex,
  setErrorIndexEffect,
} from './code-editor-json'

function useCodeEditorInstance(params: {
  host: Ref<HTMLDivElement | null>
  editor: Ref<EditorView | null>
  modelValue: Ref<string>
  placeholder: Ref<string>
  language: Ref<EditorLanguage>
  disabled: Ref<boolean>
  canFormatJson: Ref<boolean>
  isJsonLanguage: Ref<boolean>
  isApplyingExternal: Ref<boolean>
  jsonError: Ref<JsonParseErrorDetail | null>
  emit: (event: 'update:modelValue', value: string) => void
}) {
  const languageCompartment = new Compartment()
  const placeholderCompartment = new Compartment()
  const editableCompartment = new Compartment()

  function setEditorErrorIndex(index: number | null) {
    const view = params.editor.value
    if (!view) {
      return
    }
    view.dispatch({ effects: setErrorIndexEffect.of(index) })
  }

  function validateJsonDoc(text: string, options: { focusError?: boolean } = {}) {
    if (!params.isJsonLanguage.value) {
      params.jsonError.value = null
      setEditorErrorIndex(null)
      return true
    }
    const trimmed = text.trim()
    if (!trimmed) {
      params.jsonError.value = null
      setEditorErrorIndex(null)
      return true
    }
    try {
      JSON.parse(text)
      params.jsonError.value = null
      setEditorErrorIndex(null)
      return true
    }
    catch (error) {
      const detail = parseJsonError(text, error)
      params.jsonError.value = detail
      setEditorErrorIndex(detail.index)
      if (options.focusError && typeof detail.index === 'number') {
        const view = params.editor.value
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
    if (!params.canFormatJson.value) {
      return
    }
    const view = params.editor.value
    if (!view) {
      return
    }
    const text = view.state.doc.toString()
    const trimmed = text.trim()
    if (!trimmed) {
      params.jsonError.value = null
      setEditorErrorIndex(null)
      return
    }
    try {
      const parsed = JSON.parse(text)
      const formatted = JSON.stringify(parsed, null, 2)
      const current = view.state.doc.toString()
      if (formatted === current) {
        params.jsonError.value = null
        setEditorErrorIndex(null)
        return
      }
      params.isApplyingExternal.value = true
      view.dispatch({
        changes: { from: 0, to: current.length, insert: formatted },
        selection: EditorSelection.cursor(formatted.length),
      })
      params.isApplyingExternal.value = false
      params.emit('update:modelValue', formatted)
      params.jsonError.value = null
      setEditorErrorIndex(null)
    }
    catch (error) {
      const detail = parseJsonError(text, error)
      params.jsonError.value = detail
      setEditorErrorIndex(detail.index)
      validateJsonDoc(text, { focusError: true })
    }
  }

  function createState() {
    return EditorState.create({
      doc: params.modelValue.value,
      extensions: [
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        errorLineField,
        EditorView.lineWrapping,
        languageCompartment.of(resolveLanguageExtension(params.language.value)),
        placeholderCompartment.of(
          params.placeholder.value
            ? placeholderExtension(params.placeholder.value)
            : [],
        ),
        editableCompartment.of(EditorView.editable.of(!params.disabled.value)),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || params.isApplyingExternal.value) {
            return
          }
          const next = update.state.doc.toString()
          params.emit('update:modelValue', next)
          queueMicrotask(() => validateJsonDoc(next))
        }),
      ],
    })
  }

  onMounted(() => {
    if (!params.host.value) {
      return
    }
    params.editor.value = new EditorView({
      state: createState(),
      parent: params.host.value,
    })
    validateJsonDoc(params.modelValue.value)
  })

  watch(params.modelValue, (value) => {
    const view = params.editor.value
    if (!view) {
      return
    }
    const current = view.state.doc.toString()
    if (current === value) {
      return
    }
    params.isApplyingExternal.value = true
    const anchor = Math.min(view.state.selection.main.anchor, value.length)
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      selection: EditorSelection.cursor(anchor),
    })
    params.isApplyingExternal.value = false
    validateJsonDoc(value)
  })

  watch(params.language, (value) => {
    const view = params.editor.value
    if (!view) {
      return
    }
    view.dispatch({
      effects: languageCompartment.reconfigure(resolveLanguageExtension(value)),
    })
    validateJsonDoc(view.state.doc.toString())
  })

  watch(params.placeholder, (value) => {
    const view = params.editor.value
    if (!view) {
      return
    }
    view.dispatch({
      effects: placeholderCompartment.reconfigure(value ? placeholderExtension(value) : []),
    })
  })

  watch(params.disabled, (value) => {
    const view = params.editor.value
    if (!view) {
      return
    }
    view.dispatch({
      effects: editableCompartment.reconfigure(EditorView.editable.of(!value)),
    })
  })

  onBeforeUnmount(() => {
    params.editor.value?.destroy()
    params.editor.value = null
  })

  return {
    formatJson,
    validateJsonDoc,
  }
}

export { useCodeEditorInstance }
