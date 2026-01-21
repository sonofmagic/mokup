import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectFiles, isSupportedFile } from '../src/dev/files'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-files-'))
  return root
}

describe('dev files helpers', () => {
  it('collects files recursively and skips ignored directories', async () => {
    const root = await createTempRoot()
    const mockDir = path.join(root, 'mock')
    try {
      await fs.mkdir(path.join(mockDir, 'node_modules'), { recursive: true })
      await fs.mkdir(path.join(mockDir, '.git'), { recursive: true })
      await fs.mkdir(path.join(mockDir, 'nested'), { recursive: true })
      await fs.writeFile(path.join(mockDir, 'users.json'), '{}', 'utf8')
      await fs.writeFile(path.join(mockDir, 'node_modules', 'skip.json'), '{}', 'utf8')
      await fs.writeFile(path.join(mockDir, 'nested', 'profile.ts'), 'export {}', 'utf8')

      const files = await collectFiles([mockDir, path.join(root, 'missing')])
      const basenames = files.map(entry => path.basename(entry.file)).sort()
      expect(basenames).toEqual(['profile.ts', 'users.json'])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('filters supported extensions and ignores config/d.ts files', () => {
    expect(isSupportedFile('/tmp/route.d.ts')).toBe(false)
    expect(isSupportedFile('/tmp/index.config.ts')).toBe(false)
    expect(isSupportedFile('/tmp/route.JSON')).toBe(true)
    expect(isSupportedFile('/tmp/route.ts')).toBe(true)
  })
})
