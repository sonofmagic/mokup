export type ThemeMode = 'system' | 'light' | 'dark'
export type ThemeValue = 'light' | 'dark'

const THEME_KEY = 'mokup.playground.theme'

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

export function persistThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode)
  }
  catch {
    // ignore storage errors
  }
}

export function nextThemeMode(mode: ThemeMode): ThemeMode {
  if (mode === 'system') {
    return 'light'
  }
  if (mode === 'light') {
    return 'dark'
  }
  return 'system'
}

export function resolveTheme(mode: ThemeMode, prefersDark: boolean): ThemeValue {
  if (mode === 'dark') {
    return 'dark'
  }
  if (mode === 'light') {
    return 'light'
  }
  return prefersDark ? 'dark' : 'light'
}

export function applyTheme(mode: ThemeMode, prefersDark: boolean) {
  const theme = resolveTheme(mode, prefersDark)
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  return theme
}

export function initTheme() {
  const mode = readThemeMode() ?? 'system'
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme(mode, prefersDark)
  return mode
}
