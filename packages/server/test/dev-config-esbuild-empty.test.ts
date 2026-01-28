import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { resolveDirectoryConfig } from '../src/dev/config'

vi.mock('../src/dev/tsx-loader', () => ({
  ensureTsxRegister: vi.fn().mockResolvedValue(false),
}))

vi.mock('@mokup/shared/esbuild', () => ({
  build: vi.fn().mockResolvedValue({ outputFiles: [] }),
}))

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-config-empty-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

describe('dev config esbuild fallback', () => {
  it('handles empty esbuild output for ts configs', async () => {
    const { root, mockDir } = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const routeFile = path.join(mockDir, 'users.get.json')
      await fs.writeFile(routeFile, '{}', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'index.config.ts'),
        'export default { delay: 5 }',
        'utf8',
      )

      const config = await resolveDirectoryConfig({
        file: routeFile,
        rootDir: mockDir,
        logger,
        configCache: new Map(),
        fileCache: new Map(),
      })

      expect(config.middlewares).toEqual([])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
