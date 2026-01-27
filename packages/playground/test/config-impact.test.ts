import { describe, expect, it } from 'vitest'
import { buildConfigImpactRoutes } from '../src/hooks/playground-config-impact'

describe('playground config impact', () => {
  it('returns empty list when no file is selected', () => {
    const result = buildConfigImpactRoutes({
      routes: [],
      disabledRoutes: [],
      ignoredRoutes: [],
    })
    expect(result).toEqual([])
  })

  it('collects impacted routes from config chains', () => {
    const selectedFile = '/root/mock/index.config.ts'
    const result = buildConfigImpactRoutes({
      selectedFile,
      routes: [
        { file: '/root/mock/ping.get.ts', configChain: [selectedFile] },
      ],
      disabledRoutes: [
        { file: '/root/mock/off.get.ts', configChain: [selectedFile], method: 'GET', url: '/off' },
      ],
      ignoredRoutes: [
        { file: '/root/mock/ignored.ts', configChain: [selectedFile] },
      ],
    })

    expect(result).toEqual([
      { kind: 'active', file: '/root/mock/ping.get.ts' },
      { kind: 'disabled', file: '/root/mock/off.get.ts', method: 'GET', url: '/off' },
      { kind: 'ignored', file: '/root/mock/ignored.ts' },
    ])
  })
})
