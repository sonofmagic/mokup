import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { loadRules } from '../src/manifest/rules'

vi.mock('@mokup/shared/esbuild', () => ({
  build: vi.fn().mockResolvedValue({ outputFiles: [] }),
}))

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-cli-rules-empty-'))
  return root
}

describe('loadRules esbuild empty output', () => {
  it('handles empty bundle output for ts rules', async () => {
    const root = await createTempRoot()
    try {
      const ruleFile = path.join(root, 'rules.ts')
      await fs.writeFile(ruleFile, 'export default { handler: { ok: true } }', 'utf8')

      const rules = await loadRules(ruleFile)
      expect(rules).toHaveLength(1)
      expect(rules[0]).not.toBeNull()
      expect(typeof rules[0]).toBe('object')
      expect(Object.keys(rules[0] as Record<string, unknown>)).toHaveLength(0)
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
