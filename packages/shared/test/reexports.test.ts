import { describe, expect, it } from 'vitest'
import { createRouteDiagnosticSections } from '../src/diagnostics'
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

  it('builds shared route diagnostic sections', () => {
    expect(createRouteDiagnosticSections({
      invalidRoutes: ['mock/invalid.ts'],
      duplicateRoutes: ['GET /api/users'],
    })).toEqual([
      expect.objectContaining({
        category: 'invalid-route',
        items: ['mock/invalid.ts'],
      }),
      expect.objectContaining({
        category: 'unsupported-fields',
        items: [],
      }),
      expect.objectContaining({
        category: 'missing-handler',
        items: [],
      }),
      expect.objectContaining({
        category: 'duplicate-route',
        items: ['GET /api/users'],
      }),
    ])
  })
})
