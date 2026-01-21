import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'

export async function ensureEmptyDir(dir: string) {
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

export async function writeJson(filePath: string, value: unknown) {
  const raw = JSON.stringify(value, null, 2)
  await writeFile(filePath, `${raw}\n`, 'utf8')
}
