import type { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'

type EditorLanguage = 'text' | 'json'

interface JsonParseErrorDetail {
  message: string
  index: number | null
  line: number | null
  column: number | null
}

const POSITION_PATTERN = /position\s+(\d+)/i
const END_OF_JSON_INPUT_PATTERN = /end of json input/i

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

function resolveLanguageExtension(language: EditorLanguage): Extension {
  return language === 'json' ? json() : []
}

function resolveRangeFromIndex(docLength: number, index: number) {
  if (docLength <= 0) {
    return { from: 0, to: 0 }
  }
  const safeIndex = Math.max(0, Math.min(index, docLength - 1))
  return {
    from: safeIndex,
    to: Math.min(safeIndex + 1, docLength),
  }
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
  const match = message.match(POSITION_PATTERN)
  if (match) {
    const value = Number(match[1])
    if (Number.isFinite(value)) {
      return Math.max(0, value)
    }
  }
  if (END_OF_JSON_INPUT_PATTERN.test(message)) {
    return Math.max(text.length - 1, 0)
  }
  return null
}

function parseJsonError(text: string, error: unknown): JsonParseErrorDetail {
  const message = error instanceof Error ? error.message : String(error)
  const index = resolveJsonErrorIndex(message, text)
  if (index === null) {
    return { message, index: null, line: null, column: null }
  }
  const { line, column } = resolveLineColumn(text, index)
  return { message, index, line, column }
}

export {
  errorLineField,
  parseJsonError,
  resolveLanguageExtension,
  resolveRangeFromIndex,
  setErrorIndexEffect,
}

export type { EditorLanguage, JsonParseErrorDetail }
