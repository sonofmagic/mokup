import { describe, expect, it } from 'vitest'
import { normalizeBasePath, toPosixPath } from '../src/utils/path'

describe('path utils', () => {
  it('normalizes base paths', () => {
    expect(normalizeBasePath('/')).toBe('')
    expect(normalizeBasePath('/docs/')).toBe('/docs')
    expect(normalizeBasePath('/docs/index.html')).toBe('/docs')
    expect(normalizeBasePath('/docs')).toBe('/docs')
  })

  it('converts to posix path', () => {
    expect(toPosixPath('mock\\routes\\index.ts')).toBe('mock/routes/index.ts')
  })
})
