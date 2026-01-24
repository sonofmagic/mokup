import type { VitePluginOptions } from '../../shared/types'
import { resolveDirs } from '../../shared/utils'
import { normalizeBase, resolveRegisterPath, resolveRegisterScope } from './paths'

function createDirResolver(optionList: VitePluginOptions[], root: () => string) {
  return () => {
    const dirs: string[] = []
    const seen = new Set<string>()
    for (const entry of optionList) {
      for (const dir of resolveDirs(entry.dir, root())) {
        if (seen.has(dir)) {
          continue
        }
        seen.add(dir)
        dirs.push(dir)
      }
    }
    return dirs
  }
}

function createSwPathResolver(base: () => string) {
  return {
    resolveSwRequestPath: (path: string) => resolveRegisterPath(base(), path),
    resolveSwRegisterScope: (scope: string) => resolveRegisterScope(base(), scope),
  }
}

function createHtmlAssetResolver(base: () => string, assetsDir: () => string) {
  const resolveHtmlAssetPath = (fileName: string) => {
    const normalizedFileName = fileName.startsWith('/')
      ? fileName.slice(1)
      : fileName
    const currentBase = base()
    if (currentBase && currentBase.startsWith('.')) {
      return normalizedFileName
    }
    const normalizedBase = normalizeBase(currentBase)
    return `${normalizedBase}${normalizedFileName}`
  }
  const resolveAssetsFileName = (fileName: string) => {
    const trimmed = assetsDir().replace(/^\/+|\/+$/g, '')
    if (!trimmed) {
      return fileName
    }
    return `${trimmed}/${fileName}`
  }
  return { resolveHtmlAssetPath, resolveAssetsFileName }
}

export { createDirResolver, createHtmlAssetResolver, createSwPathResolver }
