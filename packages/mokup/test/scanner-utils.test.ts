import { describe, expect, it } from 'vitest'
import {
  buildEffectiveConfig,
  buildSkipInfo,
  resolveSkipRoute,
  testPatterns,
  toFilterStrings,
} from '../src/core/scanner-utils'

describe('scanner utils', () => {
  it('resolves skip routes and builds skip info', () => {
    const resolved = resolveSkipRoute({
      file: '/root/mock/users.get.json',
      rootDir: '/root/mock',
      prefix: '/api',
    })
    expect(resolved).toEqual({ method: 'GET', url: '/api/users' })

    const missing = resolveSkipRoute({
      file: '/root/mock/notes.txt',
      rootDir: '/root/mock',
      prefix: '/api',
    })
    expect(missing).toBeNull()

    const info = buildSkipInfo(
      '/root/mock/users.get.json',
      'exclude',
      resolved ?? undefined,
      ['config.ts'],
      [{ step: 'filter', result: 'fail' }],
      { enabled: false },
    )
    expect(info).toMatchObject({
      reason: 'exclude',
      method: 'GET',
      url: '/api/users',
      configChain: ['config.ts'],
      effectiveConfig: { enabled: false },
    })
  })

  it('filters patterns and builds effective config values', () => {
    expect(toFilterStrings()).toEqual([])
    expect(toFilterStrings([/ok/, 'bad' as unknown as RegExp])).toEqual(['/ok/'])
    expect(testPatterns([/ok/, /nope/], '/root/mock/ok.get.json')).toBe(true)

    const effective = buildEffectiveConfig({
      config: {
        headers: { 'x-test': '1' },
        status: 201,
        delay: 5,
        enabled: false,
      },
      effectiveIgnorePrefix: ['.', '_'],
      effectiveInclude: /users/,
      effectiveExclude: [/skip/, /omit/],
    })
    expect(effective).toEqual({
      headers: { 'x-test': '1' },
      status: 201,
      delay: 5,
      enabled: false,
      ignorePrefix: ['.', '_'],
      include: '/users/',
      exclude: ['/skip/', '/omit/'],
    })
  })
})
