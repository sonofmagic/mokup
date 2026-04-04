import { describe, expect, it } from 'vitest'
import { diagnosticCategories, isDiagnosticCategory } from '../src/diagnostic-types'

describe('diagnostic types', () => {
  it('exports the full ordered diagnostic category list', () => {
    expect(diagnosticCategories).toEqual([
      'invalid-route',
      'unsupported-fields',
      'missing-handler',
      'duplicate-route',
      'sw-conflict',
    ])
  })

  it('detects supported diagnostic categories', () => {
    expect(isDiagnosticCategory('invalid-route')).toBe(true)
    expect(isDiagnosticCategory('sw-conflict')).toBe(true)
    expect(isDiagnosticCategory('not-a-category')).toBe(false)
  })
})
