import { describe, expect, it, vi } from 'vitest'
import { runRoutePrechecks } from '../src/core/scanner-precheck'

describe('scanner prechecks', () => {
  it('skips when config disables directory', () => {
    const onSkip = vi.fn()
    const result = runRoutePrechecks({
      fileInfo: { file: '/root/mock/users.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: { enabled: false },
      configChain: ['index.config.js'],
      globalIgnorePrefix: [],
      shouldCollectSkip: true,
      shouldCollectIgnore: false,
      onSkip,
    })

    expect(result).toBeNull()
    expect(onSkip).toHaveBeenCalledWith(expect.objectContaining({ reason: 'disabled-dir' }))
  })

  it('skips ignored prefixes and unsupported files', () => {
    const onSkip = vi.fn()
    const onIgnore = vi.fn()
    const ignored = runRoutePrechecks({
      fileInfo: { file: '/root/mock/_ignored/users.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: { ignorePrefix: ['_'] },
      configChain: [],
      globalIgnorePrefix: ['.'],
      shouldCollectSkip: true,
      shouldCollectIgnore: true,
      onSkip,
      onIgnore,
    })

    expect(ignored).toBeNull()
    expect(onSkip).toHaveBeenCalledWith(expect.objectContaining({ reason: 'ignore-prefix' }))

    const unsupported = runRoutePrechecks({
      fileInfo: { file: '/root/mock/note.txt', rootDir: '/root/mock' },
      prefix: '/api',
      config: {},
      configChain: [],
      globalIgnorePrefix: [],
      shouldCollectSkip: true,
      shouldCollectIgnore: true,
      onSkip,
      onIgnore,
    })

    expect(unsupported).toBeNull()
    expect(onIgnore).toHaveBeenCalledWith(expect.objectContaining({ reason: 'unsupported' }))
  })

  it('applies include/exclude filters', () => {
    const onSkip = vi.fn()
    const excluded = runRoutePrechecks({
      fileInfo: { file: '/root/mock/excluded.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: {},
      configChain: [],
      globalIgnorePrefix: [],
      include: /allowed/,
      exclude: /excluded/,
      shouldCollectSkip: true,
      shouldCollectIgnore: false,
      onSkip,
    })

    expect(excluded).toBeNull()
    expect(onSkip).toHaveBeenCalledWith(expect.objectContaining({ reason: 'exclude' }))

    const included = runRoutePrechecks({
      fileInfo: { file: '/root/mock/other.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: {},
      configChain: [],
      globalIgnorePrefix: [],
      include: /allowed/,
      shouldCollectSkip: true,
      shouldCollectIgnore: false,
      onSkip,
    })

    expect(included).toBeNull()
    expect(onSkip).toHaveBeenCalledWith(expect.objectContaining({ reason: 'include' }))
  })

  it('returns decision chain when prechecks pass', () => {
    const result = runRoutePrechecks({
      fileInfo: { file: '/root/mock/allowed.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: { headers: { 'x-test': '1' } },
      configChain: [],
      globalIgnorePrefix: [],
      include: /allowed/,
      shouldCollectSkip: true,
      shouldCollectIgnore: true,
    })

    expect(result).not.toBeNull()
    expect(result?.decisionChain.length).toBeGreaterThan(0)
    expect(result?.effectiveConfigValue).toEqual({
      headers: { 'x-test': '1' },
      include: '/allowed/',
    })
  })

  it('prefers config filters and sources when provided', () => {
    const result = runRoutePrechecks({
      fileInfo: { file: '/root/mock/allowed.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: {
        enabled: true,
        include: /allowed/,
        exclude: /skip/,
        configSources: {
          enabled: '/root/mock/index.config.ts',
          include: '/root/mock/index.config.ts',
          exclude: '/root/mock/index.config.ts',
        },
      },
      configChain: ['/root/mock/index.config.ts'],
      globalIgnorePrefix: [],
      include: /fallback/,
      exclude: /fallback/,
      shouldCollectSkip: false,
      shouldCollectIgnore: false,
    })

    expect(result).not.toBeNull()
    expect(result?.decisionChain[0]?.detail).toBe('enabled=true')
    expect(result?.effectiveConfigValue).toEqual({
      enabled: true,
      include: '/allowed/',
      exclude: '/skip/',
    })
  })

  it('handles empty include/exclude patterns', () => {
    const excluded = runRoutePrechecks({
      fileInfo: { file: '/root/mock/allowed.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: { exclude: [] as unknown as RegExp[] },
      configChain: [],
      globalIgnorePrefix: [],
      shouldCollectSkip: false,
      shouldCollectIgnore: false,
    })

    expect(excluded).not.toBeNull()

    const included = runRoutePrechecks({
      fileInfo: { file: '/root/mock/allowed.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: { include: [] as unknown as RegExp[] },
      configChain: [],
      globalIgnorePrefix: [],
      shouldCollectSkip: false,
      shouldCollectIgnore: false,
    })

    expect(included).toBeNull()
  })
})
