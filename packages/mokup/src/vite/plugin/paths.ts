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

function formatPlaygroundUrl(baseUrl: string | undefined, playgroundPath: string) {
  if (!baseUrl) {
    return playgroundPath
  }
  try {
    return new URL(playgroundPath, baseUrl).href
  }
  catch {
    return playgroundPath
  }
}

function resolveSwImportPath(base: string) {
  const normalizedBase = normalizeBase(base)
  return `${normalizedBase}@id/mokup/sw`
}

function resolveSwRuntimeImportPath(base: string) {
  const normalizedBase = normalizeBase(base)
  return `${normalizedBase}@id/mokup/runtime`
}

export {
  formatPlaygroundUrl,
  normalizeBase,
  resolveRegisterPath,
  resolveRegisterScope,
  resolveSwImportPath,
  resolveSwRuntimeImportPath,
}
