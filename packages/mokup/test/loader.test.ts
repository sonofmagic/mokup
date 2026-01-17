import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { loadRules } from '../src/vite/loader'

describe('loadRules json parsing', () => {
  it('accepts json files with comments', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-jsonc-'))
    const file = path.join(root, 'commented.json')
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }

    try {
      await fs.writeFile(
        file,
        [
          '{',
          '  // allow comments',
          '  "status": "ok"',
          '}',
        ].join('\n'),
        'utf8',
      )

      const rules = await loadRules(file, undefined, logger)
      expect(rules).toHaveLength(1)
      expect(rules[0]?.response).toEqual({ status: 'ok' })
      expect(logger.warn).not.toHaveBeenCalled()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
