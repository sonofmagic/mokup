import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { loadRules } from '../src/dev/loader'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-dev-loader-'))
  return root
}

describe('dev loader', () => {
  it('loads json/jsonc rules and warns on invalid jsonc', async () => {
    const root = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const jsonFile = path.join(root, 'valid.json')
      const jsoncFile = path.join(root, 'invalid.jsonc')
      await fs.writeFile(jsonFile, '{ "ok": true }', 'utf8')
      await fs.writeFile(jsoncFile, '{ "ok": }', 'utf8')

      const jsonRules = await loadRules(jsonFile, logger)
      expect(jsonRules).toEqual([{ handler: { ok: true } }])

      const jsoncRules = await loadRules(jsoncFile, logger)
      expect(jsoncRules).toEqual([])
      expect(logger.warn).toHaveBeenCalled()
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('loads rules from module exports', async () => {
    const root = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const arrayFile = path.join(root, 'array.js')
      const functionFile = path.join(root, 'function.js')
      const objectFile = path.join(root, 'object.js')

      await fs.writeFile(
        arrayFile,
        'export default [{ handler: { ok: 1 } }, { handler: { ok: 2 } }]',
        'utf8',
      )
      await fs.writeFile(
        functionFile,
        'export default function handler() { return { ok: true } }',
        'utf8',
      )
      await fs.writeFile(
        objectFile,
        'export default { handler: { ok: "object" } }',
        'utf8',
      )

      const arrayRules = await loadRules(arrayFile, logger)
      expect(arrayRules).toHaveLength(2)

      const fnRules = await loadRules(functionFile, logger)
      expect(typeof fnRules[0]?.handler).toBe('function')

      const objRules = await loadRules(objectFile, logger)
      expect(objRules).toEqual([{ handler: { ok: 'object' } }])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('loads cjs and mjs modules', async () => {
    const root = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const cjsFile = path.join(root, 'rules.cjs')
      const mjsFile = path.join(root, 'rules.mjs')

      await fs.writeFile(
        cjsFile,
        'module.exports = { handler: { ok: "cjs" } }',
        'utf8',
      )
      await fs.writeFile(
        mjsFile,
        'export default { handler: { ok: "mjs" } }',
        'utf8',
      )

      const cjsRules = await loadRules(cjsFile, logger)
      expect(cjsRules).toEqual([{ handler: { ok: 'cjs' } }])

      const mjsRules = await loadRules(mjsFile, logger)
      expect(mjsRules).toEqual([{ handler: { ok: 'mjs' } }])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('warns when json files cannot be read', async () => {
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    const missingFile = path.join(tmpdir(), 'missing-rules.json')
    const rules = await loadRules(missingFile, logger)
    expect(rules).toEqual([])
    expect(logger.warn).toHaveBeenCalled()
  })

  it('skips unsupported extensions and empty module exports', async () => {
    const root = await createTempRoot()
    const logger = { warn: vi.fn(), info: vi.fn(), error: vi.fn() }
    try {
      const txtFile = path.join(root, 'rules.txt')
      const emptyFile = path.join(root, 'empty.mjs')

      await fs.writeFile(txtFile, 'noop', 'utf8')
      await fs.writeFile(emptyFile, 'export default null', 'utf8')

      const txtRules = await loadRules(txtFile, logger)
      expect(txtRules).toEqual([])

      const emptyRules = await loadRules(emptyFile, logger)
      expect(emptyRules).toHaveLength(1)
      expect(emptyRules[0]).toHaveProperty('default', null)
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
