import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { resolveDirectoryConfig } from '../src/dev/config'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-config-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

async function cleanupTempRoot(root: string) {
  await fs.rm(root, { recursive: true, force: true })
}

describe('dev config resolver', () => {
  it('merges config chain and normalizes middleware', async () => {
    const { root, mockDir } = await createTempRoot()
    const usersDir = path.join(mockDir, 'users')
    const routeFile = path.join(usersDir, 'profile.get.json')
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      await fs.mkdir(usersDir, { recursive: true })
      await fs.writeFile(routeFile, '{}', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'index.config.js'),
        [
          'export default {',
          '  headers: { "x-root": "1" },',
          '  status: 201,',
          '  delay: 50,',
          '  middleware: [async (_req, _res, _ctx, next) => { await next() }],',
          '}',
        ].join('\n'),
        'utf8',
      )
      await fs.writeFile(
        path.join(usersDir, 'index.config.js'),
        [
          'export default {',
          '  headers: { "x-user": "2" },',
          '  status: 404,',
          '  delay: 10,',
          '  enabled: false,',
          '  middleware: async (_req, _res, _ctx, next) => { await next() },',
          '}',
        ].join('\n'),
        'utf8',
      )

      const config = await resolveDirectoryConfig({
        file: routeFile,
        rootDir: mockDir,
        logger,
        configCache: new Map(),
        fileCache: new Map(),
      })

      expect(config.headers).toEqual({ 'x-root': '1', 'x-user': '2' })
      expect(config.status).toBe(404)
      expect(config.delay).toBe(10)
      expect(config.enabled).toBe(false)
      expect(config.middlewares).toHaveLength(2)
      expect(config.middlewares[0]?.position).toBe('normal')
      expect(config.middlewares[1]?.position).toBe('normal')
    }
    finally {
      await cleanupTempRoot(root)
    }
  })

  it('warns on invalid config and middleware entries', async () => {
    const { root, mockDir } = await createTempRoot()
    const usersDir = path.join(mockDir, 'users')
    const routeFile = path.join(usersDir, 'profile.get.json')
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      await fs.mkdir(usersDir, { recursive: true })
      await fs.writeFile(routeFile, '{}', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'index.config.js'),
        [
          'export default {',
          '  headers: { "x-root": "1" },',
          '  middleware: [',
          '    async (_req, _res, _ctx, next) => { await next() },',
          '    "invalid",',
          '  ],',
          '}',
        ].join('\n'),
        'utf8',
      )
      await fs.writeFile(
        path.join(usersDir, 'index.config.js'),
        'export default "invalid"',
        'utf8',
      )

      const config = await resolveDirectoryConfig({
        file: routeFile,
        rootDir: mockDir,
        logger,
        configCache: new Map(),
        fileCache: new Map(),
      })

      expect(config.headers).toEqual({ 'x-root': '1' })
      expect(config.middlewares).toHaveLength(1)
      expect(config.middlewares[0]?.position).toBe('normal')
      expect(logger.warn).toHaveBeenCalled()
    }
    finally {
      await cleanupTempRoot(root)
    }
  })
})
