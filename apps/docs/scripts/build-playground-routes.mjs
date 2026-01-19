import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildManifest } from '@mokup/cli'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const mockDir = path.join(rootDir, 'mock')
const distDir = path.join(rootDir, 'docs', '.vitepress', 'dist')
const playgroundDir = path.join(distDir, '_mokup')
const tempRoot = await mkdtemp(path.join(tmpdir(), 'mokup-docs-'))
const outDir = path.join(tempRoot, 'manifest')

try {
  const { manifest } = await buildManifest({
    root: rootDir,
    dir: mockDir,
    prefix: '/api',
    outDir,
  })

  const groups = [{ key: 'mock', label: 'mock' }]
  const routes = manifest.routes.map((route) => {
    const middlewares = route.middleware?.map(entry => entry.module)
    return {
      method: route.method,
      url: route.url,
      file: route.source ?? route.url,
      type: route.response.type === 'module' ? 'handler' : 'static',
      status: route.status,
      delay: route.delay,
      middlewareCount: middlewares?.length ?? 0,
      ...(middlewares && middlewares.length > 0 ? { middlewares } : {}),
      groupKey: groups[0].key,
      group: groups[0].label,
    }
  })

  const payload = {
    basePath: '/_mokup',
    count: routes.length,
    groups,
    routes,
  }

  await mkdir(playgroundDir, { recursive: true })
  await writeFile(
    path.join(playgroundDir, 'routes'),
    JSON.stringify(payload, null, 2),
    'utf8',
  )
}
finally {
  await rm(tempRoot, { recursive: true, force: true })
}
