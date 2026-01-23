import { promises as fs } from 'node:fs'
import { createRequire } from 'node:module'
import { extname, join, normalize } from '@mokup/shared/pathe'

const require = createRequire(import.meta.url)

const mimeTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
}

function resolvePlaygroundDist() {
  const pkgPath = require.resolve('@mokup/playground/package.json')
  return join(pkgPath, '..', 'dist')
}

async function readPlaygroundIndex(indexPath: string) {
  const html = await fs.readFile(indexPath, 'utf8')
  const contentType = mimeTypes['.html'] ?? 'text/html; charset=utf-8'
  return new Response(html, { headers: { 'Content-Type': contentType } })
}

async function readPlaygroundAsset(distDir: string, relPath: string) {
  if (relPath.includes('..')) {
    return new Response('Invalid path.', { status: 400 })
  }
  const normalizedPath = normalize(relPath)
  const filePath = join(distDir, normalizedPath)
  const content = await fs.readFile(filePath)
  const ext = extname(filePath)
  const contentType = mimeTypes[ext] ?? 'application/octet-stream'
  return new Response(content, { headers: { 'Content-Type': contentType } })
}

export { readPlaygroundAsset, readPlaygroundIndex, resolvePlaygroundDist }
