import { describe, expect, it } from 'vitest'
import { normalizeMokupOptions, normalizeOptions } from '../src/vite/plugin/options'

describe('vite plugin options', () => {
  it('normalizes mokup options inputs', () => {
    expect(normalizeMokupOptions(null)).toEqual({})
    expect(normalizeMokupOptions(undefined)).toEqual({})
    expect(normalizeMokupOptions('' as any)).toEqual({})

    expect(() => normalizeMokupOptions([] as any)).toThrowError(/mokup\(\{ entries/)
    expect(() => normalizeMokupOptions({ dir: 'mock' } as any)).toThrowError(/Invalid config/)
  })

  it('normalizes option entries lists', () => {
    expect(normalizeOptions({})).toEqual([{}])
    expect(normalizeOptions({ entries: { dir: 'mock' } })).toEqual([{ dir: 'mock' }])
    expect(normalizeOptions({ entries: [] })).toEqual([{}])
  })
})
