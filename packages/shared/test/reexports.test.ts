import { describe, expect, it } from 'vitest'
import { parse } from '../src/jsonc-parser'
import { join } from '../src/pathe'

describe('shared re-exports', () => {
  it('re-exports jsonc-parser', () => {
    const value = parse('{\n // comment\n "ok": true\n}')
    expect(value).toEqual({ ok: true })
  })

  it('re-exports pathe helpers', () => {
    expect(join('/root', 'mock')).toBe('/root/mock')
  })
})
