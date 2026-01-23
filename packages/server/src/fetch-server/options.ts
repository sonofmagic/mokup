import type {
  FetchServerOptions,
  FetchServerOptionsConfig,
  FetchServerOptionsInput,
} from '../fetch-options'
import { cwd as nodeCwd } from 'node:process'
import { resolveDirs } from '../dev/utils'

interface RuntimeDeno {
  cwd?: () => string
}

function normalizeEntries(
  entries: FetchServerOptions | FetchServerOptions[] | undefined,
): FetchServerOptions[] {
  const list = Array.isArray(entries)
    ? entries
    : entries
      ? [entries]
      : [{}]
  return list.length > 0 ? list : [{}]
}

function normalizeOptions(
  options: FetchServerOptionsInput,
): { entries: FetchServerOptions[], playground?: FetchServerOptionsConfig['playground'] } {
  return {
    entries: normalizeEntries(options.entries),
    playground: options.playground,
  }
}

function resolveFirst<T>(
  list: FetchServerOptions[],
  getter: (entry: FetchServerOptions) => T | undefined,
): T | undefined {
  for (const entry of list) {
    const value = getter(entry)
    if (typeof value !== 'undefined') {
      return value
    }
  }
  return undefined
}

function resolveRoot(list: FetchServerOptions[]) {
  const explicit = resolveFirst(list, entry => entry.root)
  if (explicit) {
    return explicit
  }
  const deno = (globalThis as { Deno?: RuntimeDeno }).Deno
  if (deno?.cwd) {
    return deno.cwd()
  }
  return nodeCwd()
}

function resolveAllDirs(list: FetchServerOptions[], root: string) {
  const dirs: string[] = []
  const seen = new Set<string>()
  for (const entry of list) {
    for (const dir of resolveDirs(entry.dir, root)) {
      if (seen.has(dir)) {
        continue
      }
      seen.add(dir)
      dirs.push(dir)
    }
  }
  return dirs
}

export { normalizeOptions, resolveAllDirs, resolveRoot }
