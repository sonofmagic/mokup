import type { HttpMethod, MokupViteOptions } from './types'

import { isAbsolute, resolve } from 'pathe'
import { methodSet } from './constants'

export function normalizeMethod(method?: string | null): HttpMethod | undefined {
  if (!method) {
    return undefined
  }
  const normalized = method.toUpperCase()
  if (methodSet.has(normalized as HttpMethod)) {
    return normalized as HttpMethod
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
  dir: MokupViteOptions['dir'],
  root: string,
): string[] {
  const raw = typeof dir === 'function' ? dir(root) : dir
  const resolved = Array.isArray(raw) ? raw : raw ? [raw] : ['mock']
  const normalized = resolved.map(entry =>
    isAbsolute(entry) ? entry : resolve(root, entry),
  )
  return Array.from(new Set(normalized))
}

export function createDebouncer(delayMs: number, fn: () => void) {
  let timer: NodeJS.Timeout | null = null
  return () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn()
    }, delayMs)
  }
}

export function toPosix(value: string) {
  return value.replace(/\\/g, '/')
}

export function isInDirs(file: string, dirs: string[]) {
  const normalized = toPosix(file)
  return dirs.some((dir) => {
    const normalizedDir = toPosix(dir).replace(/\/$/, '')
    return normalized === normalizedDir || normalized.startsWith(`${normalizedDir}/`)
  })
}

function testPatterns(patterns: RegExp | RegExp[], value: string) {
  const list = Array.isArray(patterns) ? patterns : [patterns]
  return list.some(pattern => pattern.test(value))
}

export function matchesFilter(
  file: string,
  include?: RegExp | RegExp[],
  exclude?: RegExp | RegExp[],
) {
  const normalized = toPosix(file)
  if (exclude && testPatterns(exclude, normalized)) {
    return false
  }
  if (include) {
    return testPatterns(include, normalized)
  }
  return true
}

export function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
