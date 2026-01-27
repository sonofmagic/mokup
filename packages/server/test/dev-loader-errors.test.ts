import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { loadRules } from '../src/dev/loader'

vi.mock('../src/dev/tsx-loader', () => ({
  ensureTsxRegister: vi.fn().mockResolvedValue(true),
}))

async function createTempRoot() {
  return await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-loader-errors-'))
}

describe('dev loader error branches', () => {
  it('distinguishes ts import failures', async () => {
    const root = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const nonObject = path.join(root, 'non-object.ts')
      const codeError = path.join(root, 'code-error.ts')
      const messageError = path.join(root, 'message-error.ts')

      await fs.writeFile(nonObject, 'throw \"boom\"', 'utf8')
      await fs.writeFile(
        codeError,
        'throw Object.assign(new Error(\"fail\"), { code: \"ERR_UNKNOWN_FILE_EXTENSION\" })',
        'utf8',
      )
      await fs.writeFile(
        messageError,
        'throw new Error(\"Unknown file extension\")',
        'utf8',
      )

      await expect(loadRules(nonObject, logger)).rejects.toBeDefined()
      await expect(loadRules(codeError, logger)).rejects.toBeDefined()
      await expect(loadRules(messageError, logger)).rejects.toBeDefined()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
