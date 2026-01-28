import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { resolveDirectoryConfig } from '../src/manifest/config'

vi.mock('@mokup/shared/esbuild', () => ({
  build: vi.fn().mockResolvedValue({ outputFiles: [] }),
}))

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-cli-config-empty-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

describe('resolveDirectoryConfig esbuild empty output', () => {
  it('tolerates empty bundle output for ts configs', async () => {
    const { root, mockDir } = await createTempRoot()
    try {
      const routeFile = path.join(mockDir, 'users.get.json')
      await fs.writeFile(routeFile, '{}', 'utf8')
      await fs.writeFile(
        path.join(mockDir, 'index.config.ts'),
        'export default { status: 201 }',
        'utf8',
      )

      const config = await resolveDirectoryConfig({
        file: routeFile,
        rootDir: mockDir,
        configCache: new Map(),
        fileCache: new Map(),
      })

      expect(config).toEqual({ middlewares: [] })
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
