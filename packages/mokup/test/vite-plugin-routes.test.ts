import { describe, expect, it } from 'vitest'
import { buildRouteSignature } from '../src/vite/plugin/routes'

describe('vite plugin route signature', () => {
  it('builds a signature from routes and metadata', () => {
    const signature = buildRouteSignature(
      [
        {
          file: '/root/mock/ping.get.ts',
          template: '/ping',
          method: 'GET',
          tokens: [],
          score: [],
          handler: () => ({ ok: true }),
          status: 200,
        },
      ],
      [
        { reason: 'disabled', file: '/root/mock/ping.get.ts', method: 'GET', url: '/ping' },
      ],
      [
        { reason: 'ignored', file: '/root/mock/bad.txt' },
      ],
      [
        { file: '/root/mock/index.config.ts', enabled: true },
      ],
      [
        { file: '/root/mock/disabled.config.ts', enabled: false },
      ],
    )

    expect(signature).toContain('GET|/ping')
    expect(signature).toContain('disabled|/root/mock/ping.get.ts')
    expect(signature).toContain('/root/mock/index.config.ts')
    expect(signature).toContain('/root/mock/disabled.config.ts')
  })
})
