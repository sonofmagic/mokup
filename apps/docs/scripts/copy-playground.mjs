import { cp, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const playgroundDist = path.resolve(rootDir, '..', '..', 'packages', 'playground', 'dist')
const docsDist = path.resolve(rootDir, 'docs', '.vitepress', 'dist')
const targetDir = path.join(docsDist, '__mokup')

await stat(playgroundDist)

await rm(targetDir, { recursive: true, force: true })
await cp(playgroundDist, targetDir, { recursive: true })
