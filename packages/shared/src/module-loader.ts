import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { extname, resolve } from './pathe'

interface TsxConfigOptions {
  baseUrl: string
  paths: Record<string, string[]>
  fileName?: string
}

export function createTsxConfigFile(options: TsxConfigOptions) {
  const config = {
    compilerOptions: {
      baseUrl: options.baseUrl,
      paths: options.paths,
    },
  }
  const configPath = options.fileName ?? resolve(tmpdir(), `mokup-tsx-${process.pid}.json`)
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
  return configPath
}

let sourceMapsEnabled = false
let tsxRegisterPromise: Promise<void> | null = null
let tsxRegisteredConfig: string | null = null

export function resetModuleLoaderForTests() {
  sourceMapsEnabled = false
  tsxRegisterPromise = null
  tsxRegisteredConfig = null
}

function ensureSourceMapsEnabled() {
  if (sourceMapsEnabled) {
    return
  }
  const setSourceMapsEnabled = (process as {
    setSourceMapsEnabled?: (enabled: boolean) => void
  }).setSourceMapsEnabled
  if (typeof setSourceMapsEnabled === 'function') {
    setSourceMapsEnabled(true)
  }
  sourceMapsEnabled = true
}

export async function ensureTsxRegister(tsconfigPath?: string | null) {
  const desired = tsconfigPath ?? null
  if (tsxRegisterPromise) {
    await tsxRegisterPromise
    if (desired && tsxRegisteredConfig !== desired) {
      tsxRegisterPromise = (async () => {
        ensureSourceMapsEnabled()
        const { register } = await import('tsx/esm/api')
        register({ tsconfig: desired })
        tsxRegisteredConfig = desired
      })()
      await tsxRegisterPromise
    }
    return tsxRegisterPromise
  }
  tsxRegisterPromise = (async () => {
    ensureSourceMapsEnabled()
    const { register } = await import('tsx/esm/api')
    if (desired) {
      register({ tsconfig: desired })
      tsxRegisteredConfig = desired
    }
    else {
      register()
      tsxRegisteredConfig = null
    }
  })()
  return tsxRegisterPromise
}

export async function loadModule(
  file: string,
  options?: { tsconfigPath?: string | null },
) {
  const ext = extname(file).toLowerCase()
  if (ext === '.cjs') {
    const require = createRequire(import.meta.url)
    delete require.cache[file]
    return require(file)
  }
  if (ext === '.js' || ext === '.mjs') {
    return import(`${pathToFileURL(file).href}?t=${Date.now()}`)
  }
  if (ext === '.ts') {
    await ensureTsxRegister(options?.tsconfigPath ?? null)
    return import(`${pathToFileURL(file).href}?t=${Date.now()}`)
  }
  return null
}
