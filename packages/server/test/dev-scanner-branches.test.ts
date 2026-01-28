import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { scanRoutes } from '../src/dev/scanner'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-scan-branches-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

describe('dev scanner extra branches', () => {
  it('skips unsupported and invalid routes without collectors', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const disabledDir = path.join(mockDir, 'disabled')
      await fs.mkdir(disabledDir, { recursive: true })
      await fs.writeFile(
        path.join(disabledDir, 'index.config.js'),
        'export default { enabled: false }',
        'utf8',
      )
      await fs.writeFile(path.join(disabledDir, 'users.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(path.join(mockDir, 'notes.txt'), 'ignore', 'utf8')
      await fs.mkdir(path.join(mockDir, '(group)'), { recursive: true })
      await fs.writeFile(
        path.join(mockDir, '(group)', 'bad.get.json'),
        '{ "ok": true }',
        'utf8',
      )
      await fs.writeFile(path.join(mockDir, 'ok.get.json'), '{ "ok": true }', 'utf8')

      const routes = await scanRoutes({
        dirs: [mockDir],
        prefix: '/api',
        logger,
      })

      expect(routes.some(route => route.template === '/api/ok')).toBe(true)
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('applies config filters, middlewares, and skips null rules', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    const skipped: Array<{ reason: string }> = []
    try {
      await fs.writeFile(
        path.join(mockDir, 'index.config.js'),
        [
          'export default {',
          '  include: /keep|mw|null/,',
          '  exclude: /skip/,',
          '  middleware: async (_c, next) => { await next() },',
          '}',
        ].join('\n'),
        'utf8',
      )
      await fs.writeFile(path.join(mockDir, 'keep.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(path.join(mockDir, 'skip.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'null.get.ts'),
        'export default [null]',
        'utf8',
      )
      await fs.writeFile(path.join(mockDir, 'mw.get.json'), '{ "ok": true }', 'utf8')

      const routes = await scanRoutes({
        dirs: [mockDir],
        prefix: '/api',
        include: /nope/,
        exclude: /keep/,
        logger,
        onSkip: info => skipped.push(info),
      })

      expect(routes.some(route => route.template === '/api/keep')).toBe(true)
      expect(routes.find(route => route.template === '/api/keep')?.middlewares?.length).toBeGreaterThan(0)
      expect(skipped.some(entry => entry.reason === 'include')).toBe(true)
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('handles invalid prefixes in resolveRule and skip metadata', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    const skipped: Array<{ reason: string, method?: string }> = []
    try {
      const disabledDir = path.join(mockDir, 'disabled')
      await fs.mkdir(disabledDir, { recursive: true })
      await fs.writeFile(
        path.join(disabledDir, 'index.config.js'),
        'export default { enabled: false }',
        'utf8',
      )
      await fs.writeFile(path.join(disabledDir, 'users.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(path.join(mockDir, 'ping.get.json'), '{ "ok": true }', 'utf8')

      const routes = await scanRoutes({
        dirs: [mockDir],
        prefix: '/(group)',
        logger,
        onSkip: info => skipped.push(info),
      })

      expect(routes).toHaveLength(0)
      const disabled = skipped.find(entry => entry.reason === 'disabled-dir')
      expect(disabled?.method).toBeUndefined()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
