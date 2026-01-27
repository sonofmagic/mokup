import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readPlaygroundAsset, readPlaygroundIndex, resolvePlaygroundDist } from '../src/dev/playground/assets'

async function createTempDir() {
  const base = await fs.mkdtemp(join(tmpdir(), 'mokup-playground-'))
  return base
}

describe('playground assets', () => {
  it('reads the playground index file', async () => {
    const dir = await createTempDir()
    const indexPath = join(dir, 'index.html')
    await fs.writeFile(indexPath, '<html>ok</html>')

    const response = await readPlaygroundIndex(indexPath)
    expect(response.headers.get('Content-Type')).toContain('text/html')
    await expect(response.text()).resolves.toContain('ok')
  })

  it('reads assets and blocks invalid paths', async () => {
    const dir = await createTempDir()
    const assetPath = join(dir, 'style.css')
    await fs.writeFile(assetPath, 'body {}')

    const okResponse = await readPlaygroundAsset(dir, 'style.css')
    expect(okResponse.status).toBe(200)
    expect(okResponse.headers.get('Content-Type')).toContain('text/css')

    const badResponse = await readPlaygroundAsset(dir, '../secret')
    expect(badResponse.status).toBe(400)
    await expect(badResponse.text()).resolves.toContain('Invalid path')
  })

  it('resolves the playground dist directory', () => {
    const distPath = resolvePlaygroundDist()
    expect(distPath).toMatch(/playground/)
    expect(distPath.endsWith('dist')).toBe(true)
  })
})
