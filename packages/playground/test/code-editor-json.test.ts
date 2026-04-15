import { describe, expect, it } from 'vitest'
import {
  parseJsonError,
  resolveLanguageExtension,
  resolveRangeFromIndex,
} from '../src/components/ui/code-editor-json'

describe('code editor json helpers', () => {
  it('resolves language extensions', () => {
    expect(resolveLanguageExtension('text')).toEqual([])
    expect(Array.isArray(resolveLanguageExtension('json'))).toBe(false)
  })

  it('clamps ranges from document indexes', () => {
    expect(resolveRangeFromIndex(0, 5)).toEqual({ from: 0, to: 0 })
    expect(resolveRangeFromIndex(10, -1)).toEqual({ from: 0, to: 1 })
    expect(resolveRangeFromIndex(10, 99)).toEqual({ from: 9, to: 10 })
  })

  it('parses json syntax error positions', () => {
    const detail = parseJsonError('{\n  "a": \n}', new Error('Unexpected token } in JSON at position 10'))
    expect(detail).toMatchObject({
      index: 10,
      line: 3,
      column: 1,
    })
  })

  it('maps end-of-input errors to the tail of the text', () => {
    const detail = parseJsonError('{"a":', new Error('Unexpected end of JSON input'))
    expect(detail.index).toBe(4)
    expect(detail.line).toBe(1)
    expect(detail.column).toBe(5)
  })

  it('keeps unknown parse errors without coordinates', () => {
    const detail = parseJsonError('{}', 'custom failure')
    expect(detail).toEqual({
      message: 'custom failure',
      index: null,
      line: null,
      column: null,
    })
  })
})
