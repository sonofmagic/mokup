import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { loadRules } from '../src/core/loader'

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
      expect(rules[0]?.handler).toEqual({ status: 'ok' })
      expect(logger.warn).not.toHaveBeenCalled()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('warns on invalid jsonc and returns empty rules', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-jsonc-'))
    const file = path.join(root, 'invalid.jsonc')
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
          '  "status": ,',
          '}',
        ].join('\n'),
        'utf8',
      )

      const rules = await loadRules(file, undefined, logger)
      expect(rules).toEqual([])
      expect(logger.warn).toHaveBeenCalled()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})

describe('loadRules with Vite server', () => {
  it('uses ssrLoadModule and invalidates modules', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-module-'))
    const file = path.join(root, 'rules.js')
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
    try {
      await fs.writeFile(file, 'export default { handler: { ok: true } }', 'utf8')
      const moduleNode = { id: file }
      const server = {
        moduleGraph: {
          getModuleById: vi.fn().mockReturnValue(moduleNode),
          invalidateModule: vi.fn(),
        },
        ssrLoadModule: vi.fn().mockResolvedValue({ default: { handler: { ok: true } } }),
      }

      const rules = await loadRules(file, server as never, logger)
      expect(rules).toEqual([{ handler: { ok: true } }])
      expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(moduleNode)
      expect(server.ssrLoadModule).toHaveBeenCalledWith(file)
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
