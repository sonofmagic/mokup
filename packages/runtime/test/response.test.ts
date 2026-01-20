import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'
import { decodeBase64 } from '../src/response'

describe('response helpers', () => {
  it('decodes base64 with atob', () => {
    vi.stubGlobal(
      'atob',
      (value: string) => Buffer.from(value, 'base64').toString('binary'),
    )
    const bytes = decodeBase64('SGVsbG8=')
    expect(new TextDecoder().decode(bytes)).toBe('Hello')
    vi.unstubAllGlobals()
  })

  it('throws when base64 decoding is unsupported', () => {
    vi.stubGlobal('atob', undefined)
    expect(() => decodeBase64('SGVsbG8=')).toThrow('Base64 decoding')
    vi.unstubAllGlobals()
  })
})
