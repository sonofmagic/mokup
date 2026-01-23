/**
 * Theme selection mode.
 *
 * @example
 * import type { ThemeMode } from '@mokup/playground'
 *
 * const mode: ThemeMode = 'system'
 */
export type ThemeMode = 'system' | 'light' | 'dark'
/**
 * Resolved theme value.
 *
 * @example
 * import type { ThemeValue } from '@mokup/playground'
 *
 * const value: ThemeValue = 'light'
 */
export type ThemeValue = 'light' | 'dark'

const THEME_KEY = 'mokup.playground.theme'

/**
 * Read the persisted theme mode from localStorage.
 *
 * @returns Theme mode or null when unset.
 *
 * @example
 * import { readThemeMode } from '@mokup/playground'
 *
 * const mode = readThemeMode()
 */
export function readThemeMode(): ThemeMode | null {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored
    }
  }
  catch {
    // ignore storage errors
  }
  return null
}

/**
 * Persist the theme mode to localStorage.
 *
 * @param mode - Theme mode to persist.
 *
 * @example
 * import { persistThemeMode } from '@mokup/playground'
 *
 * persistThemeMode('dark')
 */
export function persistThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode)
  }
  catch {
    // ignore storage errors
  }
}

/**
 * Cycle to the next theme mode.
 *
 * @param mode - Current mode.
 * @returns Next mode.
 *
 * @example
 * import { nextThemeMode } from '@mokup/playground'
 *
 * const next = nextThemeMode('system')
 */
export function nextThemeMode(mode: ThemeMode): ThemeMode {
  if (mode === 'system') {
    return 'light'
  }
  if (mode === 'light') {
    return 'dark'
  }
  return 'system'
}

/**
 * Resolve a theme mode to a concrete theme value.
 *
 * @param mode - Selected mode.
 * @param prefersDark - Browser preference.
 * @returns Resolved theme value.
 *
 * @example
 * import { resolveTheme } from '@mokup/playground'
 *
 * const value = resolveTheme('system', true)
 */
export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ThemeValue {
  if (mode === 'dark') {
    return 'dark'
  }
  if (mode === 'light') {
    return 'light'
  }
  return prefersDark ? 'dark' : 'light'
}

/**
 * Apply theme attributes to the document element.
 *
 * @param mode - Selected mode.
 * @param prefersDark - Browser preference.
 *
 * @example
 * import { applyTheme } from '@mokup/playground'
 *
 * applyTheme('dark', false)
 */
export function applyTheme(mode: ThemeMode, prefersDark: boolean) {
  const theme = resolveTheme(mode, prefersDark)
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  return theme
}

/**
 * Initialize theme observers and apply initial theme.
 *
 * @example
 * import { initTheme } from '@mokup/playground'
 *
 * initTheme()
 */
export function initTheme() {
  const mode = readThemeMode() ?? 'system'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(mode, prefersDark)
  return mode
}
