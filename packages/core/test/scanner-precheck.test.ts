import { describe, expect, it, vi } from 'vitest'
import { runRoutePrechecks } from '../src/scanner-precheck'

describe('scanner prechecks', () => {
  it('collects skip and ignore reasons', () => {
    const onSkip = vi.fn()
    const onIgnore = vi.fn()

    expect(runRoutePrechecks({
      fileInfo: { file: '/root/mock/users.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: { enabled: false },
      configChain: ['index.config.js'],
      globalIgnorePrefix: [],
      shouldCollectSkip: true,
      shouldCollectIgnore: false,
      onSkip,
    })).toBeNull()

    expect(runRoutePrechecks({
      fileInfo: { file: '/root/mock/note.txt', rootDir: '/root/mock' },
      prefix: '/api',
      config: {},
      configChain: [],
      globalIgnorePrefix: [],
      shouldCollectSkip: true,
      shouldCollectIgnore: true,
      onSkip,
      onIgnore,
    })).toBeNull()

    expect(onSkip).toHaveBeenCalledWith(expect.objectContaining({ reason: 'disabled-dir' }))
    expect(onIgnore).toHaveBeenCalledWith(expect.objectContaining({ reason: 'unsupported' }))
  })

  it('applies include and exclude filters', () => {
    const onSkip = vi.fn()

    expect(runRoutePrechecks({
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
    })).toBeNull()

    expect(runRoutePrechecks({
      fileInfo: { file: '/root/mock/other.get.json', rootDir: '/root/mock' },
      prefix: '/api',
      config: {},
      configChain: [],
      globalIgnorePrefix: [],
      include: /allowed/,
      shouldCollectSkip: true,
      shouldCollectIgnore: false,
      onSkip,
    })).toBeNull()

    expect(onSkip).toHaveBeenCalledWith(expect.objectContaining({ reason: 'exclude' }))
    expect(onSkip).toHaveBeenCalledWith(expect.objectContaining({ reason: 'include' }))
  })

  it('returns decision chain and effective config when checks pass', () => {
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

    expect(result?.decisionChain.length).toBeGreaterThan(0)
    expect(result?.effectiveConfigValue).toEqual({
      headers: { 'x-test': '1' },
      include: '/allowed/',
    })
  })
})
