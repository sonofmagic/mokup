import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { scanRoutes } from '../src/dev/scanner'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-scan-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

describe('dev route scanner', () => {
  it('scans routes, merges config, and skips unsupported rules', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      await fs.mkdir(path.join(mockDir, '.draft'), { recursive: true })
      await fs.writeFile(path.join(mockDir, 'users.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(
        path.join(mockDir, '.draft', 'hidden.get.json'),
        '{ "ok": true }',
        'utf8',
      )
      await fs.writeFile(
        path.join(mockDir, 'disabled.get.ts'),
        'export default { enabled: false, handler: { ok: true } }',
        'utf8',
      )
      await fs.writeFile(
        path.join(mockDir, 'skip.get.js'),
        'export default { response: { ok: true }, handler: { ok: true } }',
        'utf8',
      )
      await fs.writeFile(
        path.join(mockDir, 'index.config.js'),
        [
          'export default {',
          '  headers: { "x-root": "1" },',
          '  status: 201,',
          '  delay: 5,',
          '}',
        ].join('\n'),
        'utf8',
      )

      const routes = await scanRoutes({
        dirs: [mockDir],
        prefix: '/api',
        logger,
      })

      expect(routes).toHaveLength(1)
      expect(routes[0]?.template).toBe('/api/users')
      expect(routes[0]?.headers).toEqual({ 'x-root': '1' })
      expect(routes[0]?.status).toBe(201)
      expect(routes[0]?.delay).toBe(5)
      expect(logger.warn).toHaveBeenCalled()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('reports skip and ignore reasons across configs and filters', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    const skipped: Array<{ reason: string }> = []
    const ignored: Array<{ reason: string }> = []
    const configs: Array<{ file: string }> = []
    try {
      const disabledDir = path.join(mockDir, 'disabled')
      await fs.mkdir(disabledDir, { recursive: true })
      await fs.writeFile(
        path.join(mockDir, 'index.config.js'),
        'export default { ignorePrefix: [\"_\"] }',
        'utf8',
      )
      await fs.writeFile(
        path.join(disabledDir, 'index.config.js'),
        'export default { enabled: false }',
        'utf8',
      )
      await fs.writeFile(path.join(disabledDir, 'users.get.json'), '{ "ok": true }', 'utf8')

      await fs.writeFile(path.join(mockDir, 'users.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'users-disabled.get.js'),
        'export default { enabled: false, handler: { ok: true } }',
        'utf8',
      )
      await fs.writeFile(
        path.join(mockDir, 'users-no-handler.get.js'),
        'export default { status: 200 }',
        'utf8',
      )
      await fs.writeFile(
        path.join(mockDir, 'users-unsupported.get.js'),
        'export default { response: { ok: true }, handler: { ok: true } }',
        'utf8',
      )
      await fs.writeFile(path.join(mockDir, '_ignored.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(path.join(mockDir, 'excluded.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(path.join(mockDir, 'other.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(path.join(mockDir, 'invalid.js'), 'export default { handler: { ok: true } }', 'utf8')
      await fs.writeFile(path.join(mockDir, 'notes.txt'), 'unsupported', 'utf8')
      await fs.writeFile(path.join(mockDir, 'dup.get.json'), '{ "ok": true }', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'dup.get.js'),
        'export default { handler: { ok: true } }',
        'utf8',
      )

      const routes = await scanRoutes({
        dirs: [mockDir],
        prefix: '/api',
        include: /users|invalid|dup/,
        exclude: /excluded/,
        logger,
        onSkip: info => skipped.push(info),
        onIgnore: info => ignored.push(info),
        onConfig: info => configs.push(info),
      })

      expect(routes.length).toBeGreaterThan(0)

      const skipReasons = new Set(skipped.map(entry => entry.reason))
      expect(skipReasons.has('disabled')).toBe(true)
      expect(skipReasons.has('disabled-dir')).toBe(true)
      expect(skipReasons.has('ignore-prefix')).toBe(true)
      expect(skipReasons.has('exclude')).toBe(true)
      expect(skipReasons.has('include')).toBe(true)

      const ignoreReasons = new Set(ignored.map(entry => entry.reason))
      expect(ignoreReasons.has('unsupported')).toBe(true)
      expect(ignoreReasons.has('invalid-route')).toBe(true)

      expect(configs.some(entry => entry.file.endsWith('index.config.js'))).toBe(true)
      expect(logger.warn).toHaveBeenCalled()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
