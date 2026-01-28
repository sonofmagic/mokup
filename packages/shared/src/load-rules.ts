import { readJsoncFile } from './jsonc-utils'
import { extname } from './pathe'

export interface LoadRulesOptions {
  loadModule: (file: string) => Promise<unknown | null>
  logger?: { warn?: (message: string) => void }
}

export async function loadRules<T extends { handler: unknown } = { handler: unknown }>(
  file: string,
  options: LoadRulesOptions,
): Promise<T[]> {
  const ext = extname(file).toLowerCase()
  if (ext === '.json' || ext === '.jsonc') {
    const json = await readJsoncFile(file, options.logger)
    if (typeof json === 'undefined') {
      return []
    }
    return [
      {
        handler: json,
      } as T,
    ]
  }

  const mod = await options.loadModule(file)
  const value = (mod as { default?: unknown } | undefined)?.default ?? mod
  if (!value) {
    return []
  }
  if (Array.isArray(value)) {
    return value as T[]
  }
  if (typeof value === 'function') {
    return [
      {
        handler: value,
      } as T,
    ]
  }
  return [value as T]
}
