import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { loadRules } from '../src/dev/loader'

vi.mock('../src/dev/tsx-loader', () => ({
  ensureTsxRegister: vi.fn().mockResolvedValue(false),
}))

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-loader-ts-off-'))
  return root
}

describe('dev loader ts without register', () => {
  it('bundles ts modules when tsx registration is disabled', async () => {
    const root = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const tsFile = path.join(root, 'rules.ts')
      await fs.writeFile(tsFile, 'export default { handler: { ok: true } }', 'utf8')

      const rules = await loadRules(tsFile, logger)
      expect(rules).toEqual([{ handler: { ok: true } }])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
