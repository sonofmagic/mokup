import { resolvePlaygroundOptions, resolvePlaygroundRequestPath } from '@mokup/core'
import { describe, expect, it } from 'vitest'

describe('playground config helpers', () => {
  it('returns the playground path when it already includes the base', () => {
    const path = resolvePlaygroundRequestPath('/base', '/base/__mokup')
    expect(path).toBe('/base/__mokup')
  })

  it('normalizes custom playground paths with trailing slashes', () => {
    const config = resolvePlaygroundOptions({ path: 'custom/' })
    expect(config.path).toBe('/custom')
  })
})
