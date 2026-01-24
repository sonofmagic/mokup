import type { MokupPluginOptions, VitePluginOptions } from '../../shared/types'

const legacyEntryKeys = [
  'dir',
  'prefix',
  'include',
  'exclude',
  'ignorePrefix',
  'watch',
  'log',
  'mode',
  'sw',
]

function isLegacyEntryOptions(value: Record<string, unknown>) {
  return legacyEntryKeys.some(key => key in value)
}

function normalizeMokupOptions(options: MokupPluginOptions | null | undefined): MokupPluginOptions {
  if (!options) {
    return {}
  }
  if (Array.isArray(options)) {
    throw new TypeError('[mokup] Invalid config: use mokup({ entries: [...] }) instead of mokup([...]).')
  }
  if (typeof options !== 'object') {
    return {}
  }
  if (isLegacyEntryOptions(options as Record<string, unknown>)) {
    throw new Error(
      '[mokup] Invalid config: use mokup({ entries: { ... } }) instead of mokup({ dir, prefix, ... }).',
    )
  }
  return options
}

function normalizeOptions(options: MokupPluginOptions): VitePluginOptions[] {
  const entries = options.entries
  const list = Array.isArray(entries)
    ? entries
    : entries
      ? [entries]
      : [{}]
  return list.length > 0 ? list : [{}]
}

export { normalizeMokupOptions, normalizeOptions }
