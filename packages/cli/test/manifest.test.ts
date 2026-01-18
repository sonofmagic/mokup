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
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'mokup-cli-'))
  const mockDir = path.join(root, 'mock')
  await fs.mkdir(mockDir, { recursive: true })
  return { root, mockDir }
}

async function cleanupTempRoot(root: string) {
  await fs.rm(root, { recursive: true, force: true })
}

describe('buildManifest', () => {
  it('handles json routes without method suffix and skips invalid entries', async () => {
    const { root, mockDir } = await createTempRoot()
    const logs: string[] = []
    try {
      await writeFile(path.join(mockDir, 'users.get.json'), '{"ok":true}')
      await writeFile(path.join(mockDir, 'profile.json'), '{"ok":true}')
      await writeFile(
        path.join(mockDir, 'profile.ts'),
        [
          'export default {',
          '  response: { skip: true },',
          '}',
        ].join('\n'),
      )
      await writeFile(path.join(mockDir, '(group)', 'users.get.json'), '{"skip":true}')

      const result = await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        handlers: false,
        log: message => logs.push(message),
      })

      const urls = result.manifest.routes.map(route => route.url)
      expect(urls).toHaveLength(2)
      expect(urls).toEqual(expect.arrayContaining(['/users', '/profile']))
      expect(logs.some(message => message.includes('method suffix'))).toBe(true)
      expect(logs.some(message => message.includes('Route groups'))).toBe(true)
    }
    finally {
      await cleanupTempRoot(root)
    }
  })

  it('orders static routes before dynamic and catch-all routes', async () => {
    const { root, mockDir } = await createTempRoot()
    try {
      await writeFile(path.join(mockDir, 'users', 'me.get.json'), '{"ok":true}')
      await writeFile(path.join(mockDir, 'users', '[id].get.json'), '{"ok":true}')
      await writeFile(path.join(mockDir, 'users', '[...slug].get.json'), '{"ok":true}')
      await writeFile(path.join(mockDir, 'docs', '[[...slug]].get.json'), '{"ok":true}')

      const result = await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        handlers: false,
      })

      const urls = result.manifest.routes.map(route => route.url)
      expect(urls).toContain('/docs/[[...slug]]')
      expect(urls.slice(0, 3)).toEqual([
        '/users/me',
        '/users/[id]',
        '/users/[...slug]',
      ])

      const optionalRoute = result.manifest.routes.find(
        route => route.url === '/docs/[[...slug]]',
      )
      expect(optionalRoute?.tokens).toEqual([
        { type: 'static', value: 'docs' },
        { type: 'optional-catchall', name: 'slug' },
      ])
    }
    finally {
      await cleanupTempRoot(root)
    }
  })

  it('applies prefix to derived routes', async () => {
    const { root, mockDir } = await createTempRoot()
    try {
      await writeFile(
        path.join(mockDir, 'users.post.ts'),
        [
          'export default {',
          '  response: { ok: true },',
          '}',
        ].join('\n'),
      )

      const result = await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        prefix: '/api',
        handlers: false,
      })

      expect(result.manifest.routes[0]?.method).toBe('POST')
      expect(result.manifest.routes[0]?.url).toBe('/api/users')
    }
    finally {
      await cleanupTempRoot(root)
    }
  })

  it('bundles handler modules when response is a function', async () => {
    const { root, mockDir } = await createTempRoot()
    try {
      await writeFile(
        path.join(mockDir, 'handler.get.ts'),
        [
          'export default function handler() {',
          '  return { ok: true }',
          '}',
        ].join('\n'),
      )

      const result = await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        handlers: true,
      })

      const route = result.manifest.routes[0]
      expect(route?.response.type).toBe('module')
      expect(route?.response.module).toBe('./mokup-handlers/mock/handler.get.mjs')

      const handlerPath = path.join(
        root,
        'dist',
        'mokup-handlers',
        'mock',
        'handler.get.mjs',
      )
      const stats = await fs.stat(handlerPath)
      expect(stats.isFile()).toBe(true)
    }
    finally {
      await cleanupTempRoot(root)
    }
  })

  it('applies directory config and emits middleware references', async () => {
    const { root, mockDir } = await createTempRoot()
    try {
      await writeFile(
        path.join(mockDir, 'index.config.ts'),
        [
          'export default {',
          '  headers: {',
          '    \"x-scope\": \"root\",',
          '  },',
          '  middleware: [async (_req, _res, _ctx, next) => {',
          '    await next()',
          '  }],',
          '}',
        ].join('\n'),
      )
      await writeFile(path.join(mockDir, 'users.get.json'), '{"ok":true}')

      const result = await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        handlers: true,
      })

      const route = result.manifest.routes[0]
      expect(route?.headers).toEqual({ 'x-scope': 'root' })
      expect(route?.middleware?.length).toBe(1)
      expect(route?.middleware?.[0]?.module).toBe('./mokup-handlers/mock/index.config.mjs')

      const middlewarePath = path.join(
        root,
        'dist',
        'mokup-handlers',
        'mock',
        'index.config.mjs',
      )
      const stats = await fs.stat(middlewarePath)
      expect(stats.isFile()).toBe(true)
    }
    finally {
      await cleanupTempRoot(root)
    }
  })

  it('writes an ESM manifest module alongside the JSON manifest', async () => {
    const { root, mockDir } = await createTempRoot()
    try {
      await writeFile(path.join(mockDir, 'users.get.json'), '{"ok":true}')

      await buildManifest({
        root,
        dir: 'mock',
        outDir: 'dist',
        handlers: false,
      })

      const manifestModulePath = path.join(root, 'dist', 'mokup.manifest.mjs')
      const manifestTypesPath = path.join(root, 'dist', 'mokup.manifest.d.mts')
      const bundlePath = path.join(root, 'dist', 'mokup.bundle.mjs')

      await expect(fs.stat(manifestModulePath)).resolves.toBeDefined()
      await expect(fs.stat(manifestTypesPath)).resolves.toBeDefined()

      const bundleSource = await fs.readFile(bundlePath, 'utf8')
      expect(bundleSource).toContain('mokup.manifest.mjs')
    }
    finally {
      await cleanupTempRoot(root)
    }
  })
})
