import { describe, expect, it } from 'vitest'
import { isViteDevServer } from '../src/vite/plugin/server'

describe('vite plugin server type guard', () => {
  it('detects dev servers by ws presence', () => {
    expect(isViteDevServer({ ws: {} } as never)).toBe(true)
    expect(isViteDevServer({} as never)).toBe(false)
  })
})
