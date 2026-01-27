import { describe, expect, it } from 'vitest'
import { injectPlaygroundHmr, injectPlaygroundSw, isViteDevServer } from '../src/core/playground/inject'

describe('playground html injection', () => {
  it('injects HMR script once', () => {
    const html = '<html><body>ok</body></html>'
    const withHmr = injectPlaygroundHmr(html, '/')
    expect(withHmr).toContain('mokup-playground-hmr')
    expect(injectPlaygroundHmr(withHmr, '/')).toBe(withHmr)

    const noBody = injectPlaygroundHmr('<html>ok</html>', '/base')
    expect(noBody).toContain('mokup-playground-hmr')
    expect(noBody).toContain('/base/@vite/client')
  })

  it('injects SW script into head or body', () => {
    const html = '<html><head></head><body>ok</body></html>'
    const script = 'console.log("sw")'
    const injected = injectPlaygroundSw(html, script)
    expect(injected).toContain('mokup-playground-sw')
    expect(injectPlaygroundSw(injected, script)).toBe(injected)

    const withoutHead = injectPlaygroundSw('<body>ok</body>', script)
    expect(withoutHead).toContain('mokup-playground-sw')
    expect(injectPlaygroundSw(html, null)).toBe(html)
  })

  it('detects Vite dev servers', () => {
    expect(isViteDevServer({ ws: {} } as never)).toBe(true)
    expect(isViteDevServer({} as never)).toBe(false)
    expect(isViteDevServer(undefined)).toBe(false)
  })
})
