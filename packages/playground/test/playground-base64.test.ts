import { afterEach, describe, expect, it, vi } from 'vitest'
import { decodeBase64 } from '../src/hooks/playground-request/base64'

describe('playground base64 decoding', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns undefined for empty inputs', () => {
    expect(decodeBase64('  ').value).toBeUndefined()
  })

  it('decodes data URLs and reports invalid payloads', () => {
    vi.stubGlobal('atob', (input: string) => {
      if (input === 'YWJj') {
        return 'abc'
      }
      throw new Error('bad')
    })

    const decoded = decodeBase64('data:application/octet-stream;base64,YWJj')
    expect(decoded.value).toBeInstanceOf(Uint8Array)
    expect(Array.from(decoded.value ?? [])).toEqual([97, 98, 99])

    const failed = decodeBase64('###')
    expect(failed.error).toBe('Invalid base64')
  })
})
