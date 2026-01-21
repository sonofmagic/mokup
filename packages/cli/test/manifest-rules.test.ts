import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadRules } from '../src/manifest/rules'

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-cli-rules-'))
  return root
}

describe('manifest rules loader', () => {
  it('loads json/jsonc rules and skips invalid jsonc', async () => {
    const root = await createTempRoot()
    try {
      const jsonFile = path.join(root, 'valid.json')
      const jsoncFile = path.join(root, 'invalid.jsonc')
      await fs.writeFile(jsonFile, '{ "ok": true }', 'utf8')
      await fs.writeFile(jsoncFile, '{ "ok": }', 'utf8')

      const jsonRules = await loadRules(jsonFile)
      expect(jsonRules).toEqual([{ handler: { ok: true } }])

      const jsoncRules = await loadRules(jsoncFile)
      expect(jsoncRules).toEqual([])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })

  it('loads rules from module exports', async () => {
    const root = await createTempRoot()
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

      const arrayRules = await loadRules(arrayFile)
      expect(arrayRules).toHaveLength(2)

      const fnRules = await loadRules(functionFile)
      expect(typeof fnRules[0]?.handler).toBe('function')

      const objRules = await loadRules(objectFile)
      expect(objRules).toEqual([{ handler: { ok: 'object' } }])
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
