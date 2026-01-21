import { describe, expect, it, vi } from 'vitest'
import { applyQuery, parseJsonInput } from '../src/utils/request'

describe('request utils', () => {
  it('parses JSON input safely', () => {
    expect(parseJsonInput('')).toEqual({ value: undefined })
    expect(parseJsonInput(' {"ok":true} ')).toEqual({ value: { ok: true } })

    const invalid = parseJsonInput('{')
    expect(invalid.value).toBeUndefined()
    expect(invalid.error).toBeTypeOf('string')
  })

  it('reports error messages when parse throws', () => {
    const parseSpy = vi.spyOn(JSON, 'parse').mockImplementation(() => {
      throw new Error('bad')
    })
    const invalid = parseJsonInput('{ bad }')
    expect(invalid.error).toBe('bad')
    parseSpy.mockRestore()
  })

  it('applies query parameters to URLs', () => {
    const url = new URL('https://example.com/')
    applyQuery(url, { foo: 'bar', list: [1, 2], empty: undefined })

    expect(url.searchParams.get('foo')).toBe('bar')
    expect(url.searchParams.getAll('list')).toEqual(['1', '2'])
    expect(url.searchParams.has('empty')).toBe(false)
  })
})
