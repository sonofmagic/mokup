import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { resolveDirectoryConfig } from '../src/dev/config'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-config-errors-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

describe('dev config error branches', () => {
  it('rethrows non-extension errors from ts configs', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const routeFile = path.join(mockDir, 'users.get.json')
      await fs.writeFile(routeFile, '{}', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'index.config.ts'),
        'throw \"boom\"',
        'utf8',
      )

      await expect(resolveDirectoryConfig({
        file: routeFile,
        rootDir: mockDir,
        logger,
        configCache: new Map(),
        fileCache: new Map(),
      })).rejects.toBeDefined()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('falls back when error messages match unknown extension patterns', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const routeFile = path.join(mockDir, 'users.get.json')
      await fs.writeFile(routeFile, '{}', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'index.config.ts'),
        [
          'const err = new Error(\"Unknown file extension: .ts\")',
          'throw err',
        ].join('\n'),
        'utf8',
      )

      await expect(resolveDirectoryConfig({
        file: routeFile,
        rootDir: mockDir,
        logger,
        configCache: new Map(),
        fileCache: new Map(),
      })).rejects.toBeDefined()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('handles errors with unknown extension codes', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const routeFile = path.join(mockDir, 'users.get.json')
      await fs.writeFile(routeFile, '{}', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'index.config.ts'),
        [
          'const err = new Error(\"boom\")',
          'err.code = \"ERR_UNKNOWN_FILE_EXTENSION\"',
          'throw err',
        ].join('\n'),
        'utf8',
      )

      await expect(resolveDirectoryConfig({
        file: routeFile,
        rootDir: mockDir,
        logger,
        configCache: new Map(),
        fileCache: new Map(),
      })).rejects.toBeDefined()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
