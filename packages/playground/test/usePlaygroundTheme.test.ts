import { afterEach, describe, expect, it, vi } from 'vitest'

import { usePlaygroundTheme } from '../src/hooks/usePlaygroundTheme'

const hooks = vi.hoisted(() => ({
  beforeUnmount: null as null | (() => void),
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    onMounted: (cb: () => void) => cb(),
    onBeforeUnmount: (cb: () => void) => {
      hooks.beforeUnmount = cb
    },
  }
})

const themeMocks = vi.hoisted(() => ({
  applyTheme: vi.fn(),
  nextThemeMode: vi.fn((mode: string) => (mode === 'system' ? 'light' : 'system')),
  persistThemeMode: vi.fn(),
  readThemeMode: vi.fn(() => 'dark'),
  resolveTheme: vi.fn((mode: string) => mode),
}))

vi.mock('../src/utils/theme', () => themeMocks)

describe('usePlaygroundTheme', () => {
  it('applies and cycles theme modes', () => {
    const changeHandlers: Array<() => void> = []
    const addListener = vi.fn()
    const removeListener = vi.fn()
    vi.stubGlobal('window', {
      matchMedia: () => ({
        matches: true,
        addEventListener: (_event: string, handler: () => void) => {
          changeHandlers.push(handler)
          addListener()
        },
        removeEventListener: removeListener,
      }),
    })

    const theme = usePlaygroundTheme()
    expect(theme.themeMode.value).toBe('dark')
    expect(themeMocks.applyTheme).toHaveBeenCalled()

    theme.setThemeMode('light')
    expect(themeMocks.persistThemeMode).toHaveBeenCalled()

    theme.cycleThemeMode()
    expect(themeMocks.nextThemeMode).toHaveBeenCalled()
    expect(themeMocks.persistThemeMode).toHaveBeenCalled()

    theme.setThemeMode('system')
    changeHandlers.forEach(handler => handler())
    expect(themeMocks.applyTheme).toHaveBeenCalledWith('system', true)

    hooks.beforeUnmount?.()
    expect(removeListener).toHaveBeenCalled()
  })

  it('uses system default and ignores media updates after unmount', () => {
    const changeHandlers: Array<() => void> = []
    vi.stubGlobal('window', {
      matchMedia: () => ({
        matches: false,
        addEventListener: (_event: string, handler: () => void) => {
          changeHandlers.push(handler)
        },
        removeEventListener: vi.fn(),
      }),
    })

    themeMocks.readThemeMode.mockReturnValueOnce(undefined)
    themeMocks.applyTheme.mockClear()

    const theme = usePlaygroundTheme()
    expect(theme.themeMode.value).toBe('system')
    expect(theme.effectiveTheme.value).toBe('system')
    expect(themeMocks.applyTheme).toHaveBeenCalled()

    hooks.beforeUnmount?.()
    const calls = themeMocks.applyTheme.mock.calls.length
    changeHandlers.forEach(handler => handler())
    expect(themeMocks.applyTheme.mock.calls.length).toBe(calls)
  })

  it('ignores media updates when theme mode is fixed', () => {
    const changeHandlers: Array<() => void> = []
    vi.stubGlobal('window', {
      matchMedia: () => ({
        matches: true,
        addEventListener: (_event: string, handler: () => void) => {
          changeHandlers.push(handler)
        },
        removeEventListener: vi.fn(),
      }),
    })

    themeMocks.applyTheme.mockClear()
    const theme = usePlaygroundTheme()
    themeMocks.applyTheme.mockClear()

    theme.setThemeMode('light')
    const calls = themeMocks.applyTheme.mock.calls.length
    changeHandlers.forEach(handler => handler())
    expect(themeMocks.applyTheme.mock.calls.length).toBe(calls)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
})
