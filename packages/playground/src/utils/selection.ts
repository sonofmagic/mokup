const LAST_SELECTED_ROUTE_KEY = 'mokup.playground.lastSelectedRoute'

/**
 * Read the last selected API route key from localStorage.
 *
 * @returns Route key or null when unset.
 *
 * @example
 * import { readLastSelectedRouteKey } from '@mokup/playground'
 *
 * const key = readLastSelectedRouteKey()
 */
export function readLastSelectedRouteKey(): string | null {
  try {
    const stored = localStorage.getItem(LAST_SELECTED_ROUTE_KEY)
    return stored && stored.trim() ? stored : null
  }
  catch {
    // ignore storage errors
  }
  return null
}

/**
 * Persist the last selected API route key to localStorage.
 *
 * @param key - Route key to persist or null to clear.
 *
 * @example
 * import { persistLastSelectedRouteKey } from '@mokup/playground'
 *
 * persistLastSelectedRouteKey('GET /api/ping')
 */
export function persistLastSelectedRouteKey(key: string | null) {
  try {
    if (key && key.trim()) {
      localStorage.setItem(LAST_SELECTED_ROUTE_KEY, key)
    }
    else {
      localStorage.removeItem(LAST_SELECTED_ROUTE_KEY)
    }
  }
  catch {
    // ignore storage errors
  }
}
