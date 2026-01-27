import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildManifest } from '../src/index'

async function writeFile(filePath: string, contents: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, contents, 'utf8')
}

async function createTempRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mokup-cli-extra-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

async function cleanupTempRoot(root: string) {
  await fs.rm(root, { recursive: true, force: true })
}

describe('buildManifest extra branches', () => {
  it('skips invalid rules, ignores config-disabled dirs, and merges rule overrides', async () => {
    const { root, mockDir } = await createTempRoot()
    const logs: string[] = []
    try {
      await writeFile(
        path.join(mockDir, 'index.config.js'),
        [
          'export default {',
          '  headers: { \"x-config\": \"1\" },',
          '  ignorePrefix: \"_\",',
          '}',
        ].join('\n'),
      )
      await writeFile(
        path.join(mockDir, 'disabled', 'index.config.js'),
        'export default { enabled: false }',
      )
      await writeFile(path.join(mockDir, 'disabled', 'skip.get.json'), '{"ok":true}')
      await writeFile(path.join(mockDir, '_ignored.get.json'), '{"ok":true}')
      await writeFile(
        path.join(mockDir, 'keep.get.ts'),
        [
          'export default [',
          '  null,',
          '  { enabled: false, handler: { skip: true } },',
          '  { method: \"GET\", handler: { skip: true } },',
          '  { handler: undefined },',
          '  { handler: () => ({ ok: true }) },',
          '  { handler: { ok: true }, status: 201, delay: 10, headers: { \"x-rule\": \"yes\" } },',
          '  { handler: { ok: true }, headers: { \"x-extra\": \"2\" } },',
          ']',
        ].join('\n'),
      )

      const result = await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        handlers: false,
        log: message => logs.push(message),
      })

      const urls = result.manifest.routes.map(route => route.url)
      expect(urls).toEqual(['/keep', '/keep'])

      const first = result.manifest.routes[0]
      expect(first?.status).toBe(201)
      expect(first?.delay).toBe(10)
      expect(first?.headers).toEqual({ 'x-config': '1', 'x-rule': 'yes' })

      expect(logs.some(message => message.includes('unsupported fields'))).toBe(true)
      expect(logs.some(message => message.includes('Duplicate mock route'))).toBe(true)
    }
    finally {
      await cleanupTempRoot(root)
    }
  })

  it('respects include/exclude filters', async () => {
    const { root, mockDir } = await createTempRoot()
    try {
      await writeFile(path.join(mockDir, 'keep.get.json'), '{"ok":true}')
      await writeFile(path.join(mockDir, 'skip.get.json'), '{"ok":true}')

      const result = await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        handlers: false,
        include: /keep/,
      })

      expect(result.manifest.routes.map(route => route.url)).toEqual(['/keep'])
    }
    finally {
      await cleanupTempRoot(root)
    }
  })

  it('skips rules when prefix resolves to an invalid template', async () => {
    const { root, mockDir } = await createTempRoot()
    const logs: string[] = []
    try {
      await writeFile(path.join(mockDir, 'ping.get.json'), '{"ok":true}')

      const result = await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        handlers: false,
        prefix: '/(group)',
        log: message => logs.push(message),
      })

      expect(result.manifest.routes).toHaveLength(0)
      expect(logs.some(message => message.includes('Route groups are not supported'))).toBe(true)
    }
    finally {
      await cleanupTempRoot(root)
    }
  })
})
