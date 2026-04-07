import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import process from 'node:process'

export async function ensureEmptyDir(dir: string) {
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

export async function writeTextFile(filePath: string, contents: string) {
  const tempPath = join(
    dirname(filePath),
    `.mokup-e2e-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`,
  )
  await writeFile(tempPath, contents, 'utf8')
  await rename(tempPath, filePath)
}

export async function writeJson(filePath: string, value: unknown) {
  const raw = JSON.stringify(value, null, 2)
  await writeTextFile(filePath, `${raw}\n`)
}
