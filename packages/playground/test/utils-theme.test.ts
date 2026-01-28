import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyTheme,
  initTheme,
  nextThemeMode,
  persistThemeMode,
  readThemeMode,
  resolveTheme,
} from '../src/utils/theme'

function createMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('theme utils', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.dataset.theme = ''
    document.documentElement.style.colorScheme = ''
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reads and persists theme mode', () => {
    expect(readThemeMode()).toBeNull()

    persistThemeMode('dark')
    expect(readThemeMode()).toBe('dark')

    localStorage.setItem('mokup.playground.theme', 'invalid')
    expect(readThemeMode()).toBeNull()
  })

  it('ignores storage errors gracefully', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('fail')
    })
    expect(readThemeMode()).toBeNull()
    getSpy.mockRestore()

    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('fail')
    })
    expect(() => persistThemeMode('dark')).not.toThrow()
    setSpy.mockRestore()
  })

  it('cycles theme modes', () => {
    expect(nextThemeMode('system')).toBe('light')
    expect(nextThemeMode('light')).toBe('dark')
    expect(nextThemeMode('dark')).toBe('system')
  })

  it('resolves and applies theme', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')

    const applied = applyTheme('dark', false)
    expect(applied).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('initializes theme from system preference', () => {
    vi.stubGlobal('matchMedia', createMatchMedia(true))
    const mode = initTheme()
    expect(mode).toBe('system')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
