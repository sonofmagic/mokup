import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectFiles, isConfigFile, isSupportedFile } from '../src/shared/files'

describe('shared file helpers', () => {
  it('skips node_modules and .git directories during scans', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-files-'))
    const mockDir = join(root, 'mock')
    const gitDir = join(root, '.git')
    const nodeModulesDir = join(root, 'node_modules')

    await mkdir(mockDir, { recursive: true })
    await mkdir(gitDir, { recursive: true })
    await mkdir(nodeModulesDir, { recursive: true })

    await writeFile(join(mockDir, 'users.get.json'), '{"ok":true}', 'utf8')
    await writeFile(join(nodeModulesDir, 'skip.txt'), 'skip', 'utf8')
    await writeFile(join(gitDir, 'skip.txt'), 'skip', 'utf8')

    const files = await collectFiles([root])
    const paths = files.map(entry => entry.file)
    expect(paths.some(path => path.includes('node_modules'))).toBe(false)
    expect(paths.some(path => path.includes('.git'))).toBe(false)
  })

  it('detects supported and config files', () => {
    expect(isSupportedFile('/root/mock/users.get.ts')).toBe(true)
    expect(isSupportedFile('/root/mock/types.d.ts')).toBe(false)
    expect(isSupportedFile('/root/mock/index.config.ts')).toBe(false)

    expect(isConfigFile('/root/mock/index.config.ts')).toBe(true)
    expect(isConfigFile('/root/mock/index.config.d.ts')).toBe(false)
  })
})
