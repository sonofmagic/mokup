import type { DirInput } from './index'

import { isAbsolute, resolve } from './pathe'
import { methodSet } from './route-constants'

export function normalizeMethod(method?: string | null) {
  if (!method) {
    return undefined
  }
  const normalized = method.toUpperCase()
  if (methodSet.has(normalized)) {
    return normalized
  }
  return undefined
}

export function normalizePrefix(prefix: string) {
  if (!prefix) {
    return ''
  }
  const normalized = prefix.startsWith('/') ? prefix : `/${prefix}`
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized
}

export function resolveDirs(
  dir: DirInput,
  root: string,
): string[] {
  const raw = typeof dir === 'function' ? dir(root) : dir
  const resolved = Array.isArray(raw) ? raw : raw ? [raw] : ['mock']
  const normalized = resolved.map(entry =>
    isAbsolute(entry) ? entry : resolve(root, entry),
  )
  return Array.from(new Set(normalized))
}

export function normalizeIgnorePrefix(
  value: string | string[] | undefined,
  fallback: string[] = ['.'],
) {
  const list = typeof value === 'undefined'
    ? fallback
    : Array.isArray(value)
      ? value
      : [value]
  return list.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
}
