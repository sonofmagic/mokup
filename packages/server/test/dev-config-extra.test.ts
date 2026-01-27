import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { resolveDirectoryConfig } from '../src/dev/config'

async function setupConfigDir() {
  const root = await fs.mkdtemp(join(tmpdir(), 'mokup-config-'))
  const rootConfig = join(root, 'index.config.js')
  await fs.writeFile(
    rootConfig,
    [
      'export default {',
      '  headers: { "x-root": "1" },',
      '  status: 201,',
      '  delay: 10,',
      '  enabled: true,',
      '  ignorePrefix: "_",',
      '  include: /foo/,',
      '  exclude: /bar/,',
      '  middleware: [(c, next) => next()],',
      '}',
    ].join('\n'),
    'utf8',
  )

  const nested = join(root, 'api')
  await fs.mkdir(nested, { recursive: true })
  const nestedConfig = join(nested, 'index.config.js')
  await fs.writeFile(
    nestedConfig,
    [
      'const symbol = Symbol.for("mokup.config.middlewares")',
      'export default {',
      '  [symbol]: {',
      '    pre: [() => {}, "bad"],',
      '    post: [() => {}],',
      '  },',
      '  headers: { "x-child": "1" },',
      '}',
    ].join('\n'),
    'utf8',
  )

  return { root, nested }
}

describe('resolveDirectoryConfig', () => {
  it('merges config files and middlewares', async () => {
    const { root, nested } = await setupConfigDir()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    const file = join(nested, 'users.get.ts')
    const configCache = new Map()
    const fileCache = new Map()

    try {
      const result = await resolveDirectoryConfig({
        file,
        rootDir: root,
        logger,
        configCache,
        fileCache,
      })

      expect(result.headers).toEqual({ 'x-root': '1', 'x-child': '1' })
      expect(result.status).toBe(201)
      expect(result.delay).toBe(10)
      expect(result.enabled).toBe(true)
      expect(result.ignorePrefix).toBe('_')
      expect(result.middlewares.length).toBeGreaterThan(0)
      expect(logger.warn).toHaveBeenCalled()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
