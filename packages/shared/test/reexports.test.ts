import { describe, expect, it, vi } from 'vitest'
import {
  collectRouteDiagnosticWarning,
  collectSwConflictDiagnosticWarning,
  createRouteDiagnosticSections,
  createSwConflictDiagnosticSections,
} from '../src/diagnostics'
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

  it('collects route diagnostics from warning text', () => {
    const unsupportedFields = vi.fn()
    const missingHandler = vi.fn()
    const duplicateRoute = vi.fn()

    collectRouteDiagnosticWarning({
      message: 'Skip mock with unsupported fields (response): /root/mock/a.get.ts',
      onUnsupportedFields: unsupportedFields,
      onMissingHandler: missingHandler,
      onDuplicateRoute: duplicateRoute,
    })
    collectRouteDiagnosticWarning({
      message: 'Skip mock without handler: /root/mock/b.get.ts',
      onUnsupportedFields: unsupportedFields,
      onMissingHandler: missingHandler,
      onDuplicateRoute: duplicateRoute,
    })
    collectRouteDiagnosticWarning({
      message: 'Duplicate mock route GET /api/ping from /root/mock/c.get.ts',
      onUnsupportedFields: unsupportedFields,
      onMissingHandler: missingHandler,
      onDuplicateRoute: duplicateRoute,
    })

    expect(unsupportedFields).toHaveBeenCalledWith('/root/mock/a.get.ts')
    expect(missingHandler).toHaveBeenCalledWith('/root/mock/b.get.ts')
    expect(duplicateRoute).toHaveBeenCalledWith('GET /api/ping')
  })

  it('collects and builds service worker conflict diagnostics', () => {
    const conflict = vi.fn()

    expect(collectSwConflictDiagnosticWarning({
      message: 'SW path "/other.js" ignored; using "/mokup-sw.js".',
      onConflict: conflict,
    })).toBe(true)
    expect(collectSwConflictDiagnosticWarning({
      message: 'Skip mock without handler: /root/mock/a.get.ts',
      onConflict: conflict,
    })).toBe(false)

    expect(conflict).toHaveBeenCalledWith('SW path "/other.js" ignored; using "/mokup-sw.js".')
    expect(createSwConflictDiagnosticSections([
      'SW path "/other.js" ignored; using "/mokup-sw.js".',
    ])).toEqual([
      expect.objectContaining({
        category: 'sw-conflict',
        items: ['SW path "/other.js" ignored; using "/mokup-sw.js".'],
      }),
    ])
  })
})
