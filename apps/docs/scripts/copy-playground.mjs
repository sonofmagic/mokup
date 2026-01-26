import { cp, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const playgroundRoot = path.resolve(rootDir, '..', '..', 'packages', 'playground')
const playgroundOutDir = process.env.MOKUP_PLAYGROUND_OUT_DIR?.trim() || 'dist'
const playgroundDist = path.resolve(playgroundRoot, playgroundOutDir)
const docsDist = path.resolve(rootDir, 'docs', '.vitepress', 'dist')
const targetDir = path.join(docsDist, '__mokup')
const swSource = path.join(playgroundDist, 'mokup-sw.js')
const swTarget = path.join(docsDist, 'mokup-sw.js')

await stat(playgroundDist)

await rm(targetDir, { recursive: true, force: true })
await cp(playgroundDist, targetDir, { recursive: true })
try {
  await stat(swSource)
  await cp(swSource, swTarget)
}
catch {
  // Ignore missing service worker output.
}
