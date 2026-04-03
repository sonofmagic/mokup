import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'tsdown'

interface CreatePackageConfigOptions {
  copy?: Array<{ from: string, to: string }>
  entries: string[]
  onBuildDone?: (context: { distDir: string, packageDir: string }) => Promise<void> | void
}

function toEntryMap(entries: string[]) {
  return Object.fromEntries(entries.map(entry => [entry.slice('src/'.length), `./${entry}.ts`]))
}

async function createDotDtsAliases(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true })
  await Promise.all(entries.map(async (entry) => {
    const fullPath = resolve(dir, entry.name)
    if (entry.isDirectory()) {
      await createDotDtsAliases(fullPath)
      return
    }
    if (!entry.isFile() || !entry.name.endsWith('.d.mts')) {
      return
    }
    const aliasPath = `${fullPath.slice(0, -'.d.mts'.length)}.d.ts`
    await writeFile(aliasPath, await readFile(fullPath, 'utf8'), 'utf8')
  }))
}

async function copyDirectoryContents(from: string, to: string) {
  const entries = await readdir(from, { withFileTypes: true })
  await Promise.all(entries.map(async (entry) => {
    const sourcePath = resolve(from, entry.name)
    const targetPath = resolve(to, entry.name)
    if (entry.isDirectory()) {
      await copyDirectoryContents(sourcePath, targetPath)
      return
    }
    if (!entry.isFile()) {
      return
    }
    await mkdir(dirname(targetPath), { recursive: true })
    await copyFile(sourcePath, targetPath)
  }))
}

export function createPackageConfig(options: CreatePackageConfigOptions) {
  const packageDir = process.cwd()
  const distDir = resolve(packageDir, 'dist')

  return defineConfig({
    clean: true,
    dts: {
      compilerOptions: {
        ignoreDeprecations: '6.0',
      },
    },
    entry: toEntryMap(options.entries),
    format: ['esm'],
    outDir: 'dist',
    outExtensions() {
      return {
        dts: '.d.mts',
        js: '.mjs',
      }
    },
    hooks: {
      'build:done': async () => {
        await Promise.all((options.copy ?? []).map(async ({ from, to }) => {
          await rm(resolve(packageDir, to), { force: true, recursive: true })
          await copyDirectoryContents(resolve(packageDir, from), resolve(packageDir, to))
        }))
        await createDotDtsAliases(distDir)
        await options.onBuildDone?.({ distDir, packageDir })
      },
    },
  })
}
