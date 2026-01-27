import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { scanRoutes } from '../src/core/scanner'

function createLogger() {
  const warn = vi.fn()
  const info = vi.fn()
  const error = vi.fn()
  const log = vi.fn()
  return { warn, info, error, log }
}

describe('scanRoutes', () => {
  it('collects routes, configs, skips, and ignores', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-scan-'))
    const mockDir = join(root, 'mock')
    const usersDir = join(mockDir, 'users')
    const ignoredDir = join(mockDir, '_ignored')
    await mkdir(usersDir, { recursive: true })
    await mkdir(ignoredDir, { recursive: true })

    await writeFile(
      join(mockDir, 'index.config.ts'),
      [
        'import { defineConfig } from \'mokup\'',
        'export default defineConfig(() => ({',
        '  headers: { \'x-root\': \'1\' },',
        '  delay: 50,',
        '  ignorePrefix: [\'_\'],',
        '}))',
      ].join('\n'),
      'utf8',
    )
    await writeFile(
      join(usersDir, 'index.config.ts'),
      [
        'import { defineConfig } from \'mokup\'',
        'export default defineConfig(({ pre, post }) => {',
        '  pre.use(async (_c, next) => { await next() })',
        '  post.use(async (_c, next) => { await next() })',
        '  return { status: 201, headers: { \'x-child\': \'2\' } }',
        '})',
      ].join('\n'),
      'utf8',
    )
    await writeFile(
      join(usersDir, '[id].get.ts'),
      [
        'export default {',
        '  handler: (c) => c.json({ id: c.req.param(\'id\') }),',
        '}',
      ].join('\n'),
      'utf8',
    )
    await writeFile(
      join(mockDir, 'disabled-route.get.ts'),
      [
        'export default {',
        '  enabled: false,',
        '  handler: () => ({ ok: false }),',
        '}',
      ].join('\n'),
      'utf8',
    )
    await writeFile(
      join(mockDir, 'excluded.get.json'),
      JSON.stringify({ ok: true }),
      'utf8',
    )
    await writeFile(
      join(ignoredDir, 'skip.get.json'),
      JSON.stringify({ ok: true }),
      'utf8',
    )
    await writeFile(
      join(mockDir, 'notes.txt'),
      'unsupported',
      'utf8',
    )

    const skipped: { reason: string }[] = []
    const ignored: { reason: string }[] = []
    const configs: { file: string }[] = []
    const routes = await scanRoutes({
      dirs: [mockDir],
      prefix: '/api',
      include: /users|excluded|disabled-route/,
      exclude: /excluded/,
      logger: createLogger(),
      onSkip: info => skipped.push(info),
      onIgnore: info => ignored.push(info),
      onConfig: info => configs.push(info),
    })

    expect(routes).toHaveLength(1)
    expect(routes[0]?.template).toBe('/api/users/[id]')
    expect(routes[0]?.status).toBe(201)
    expect(routes[0]?.delay).toBe(50)
    expect(routes[0]?.headers).toEqual({ 'x-root': '1', 'x-child': '2' })
    expect(routes[0]?.middlewares?.length).toBe(2)

    expect(skipped.some(entry => entry.reason === 'exclude')).toBe(true)
    expect(skipped.some(entry => entry.reason === 'disabled')).toBe(true)
    expect(skipped.some(entry => entry.reason === 'ignore-prefix')).toBe(true)
    expect(ignored.some(entry => entry.reason === 'unsupported')).toBe(true)

    const configFiles = configs.map(entry => entry.file)
    expect(configFiles.some(file => file.endsWith('index.config.ts'))).toBe(true)
  })
})
