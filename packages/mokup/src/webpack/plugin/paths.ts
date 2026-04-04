import { isAbsolute, resolve } from '@mokup/shared/pathe'
import { toPosix } from '../../shared/utils'

const ABSOLUTE_HTTP_URL_RE = /^https?:\/\//
const WINDOWS_SEPARATOR_RE = /\\/g
const WINDOWS_DRIVE_RE = /^[a-z]:\//i

function normalizeBase(base: string) {
  if (!base) {
    return '/'
  }
  if (base.startsWith('.')) {
    return '/'
  }
  let normalized = base.startsWith('/') ? base : `/${base}`
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`
  }
  return normalized
}

function resolveRegisterPath(base: string, path: string) {
  const normalizedBase = normalizeBase(base)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (normalizedPath.startsWith(normalizedBase)) {
    return normalizedPath
  }
  return `${normalizedBase}${normalizedPath.slice(1)}`
}

function resolveRegisterScope(base: string, scope: string) {
  const normalizedBase = normalizeBase(base)
  const normalizedScope = scope.startsWith('/') ? scope : `/${scope}`
  if (normalizedScope.startsWith(normalizedBase)) {
    return normalizedScope
  }
  return `${normalizedBase}${normalizedScope.slice(1)}`
}

function isAbsoluteUrl(value: string) {
  return ABSOLUTE_HTTP_URL_RE.test(value)
}

function resolveBaseFromPublicPath(publicPath: unknown) {
  if (typeof publicPath !== 'string') {
    return '/'
  }
  if (!publicPath || publicPath === 'auto') {
    return '/'
  }
  if (isAbsoluteUrl(publicPath)) {
    return '/'
  }
  return normalizeBase(publicPath)
}

function resolveAssetsDir(assetModuleFilename?: unknown) {
  if (typeof assetModuleFilename !== 'string') {
    return 'assets'
  }
  const normalized = assetModuleFilename.replace(WINDOWS_SEPARATOR_RE, '/')
  const prefix = normalized.split('/')[0] ?? ''
  if (!prefix || prefix.includes('[')) {
    return 'assets'
  }
  return prefix
}

function joinPublicPath(publicPath: string, fileName: string) {
  if (!publicPath) {
    return fileName
  }
  const normalized = publicPath.endsWith('/') ? publicPath : `${publicPath}/`
  return `${normalized}${fileName}`
}

function resolveModuleFilePath(file: string, root: string) {
  const absolute = isAbsolute(file) ? file : resolve(root, file)
  const normalized = toPosix(absolute)
  if (WINDOWS_DRIVE_RE.test(normalized)) {
    return `file:///${normalized}`
  }
  return normalized
}

export {
  joinPublicPath,
  normalizeBase,
  resolveAssetsDir,
  resolveBaseFromPublicPath,
  resolveModuleFilePath,
  resolveRegisterPath,
  resolveRegisterScope,
}
