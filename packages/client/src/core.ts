import {
  appendQueryParam,
  applyPathMap,
  getHeaderValue,
  getQueryParam,
  isAbsoluteUrl,
  joinPaths,
  mergeHeaders,
  normalizeHeaders,
  normalizePath,
  parseBoolean,
  parseUrl,
  readCookie,
} from './utils'

export interface RequestDescriptor {
  url: string
  method?: string
  headers?: Record<string, string>
  params?: Record<string, string | number | boolean>
  body?: unknown
  mock?: boolean
  meta?: Record<string, unknown>
}

export interface ResolveResult {
  mode: 'mock' | 'real'
  url: string
  headers: Record<string, string>
  meta?: {
    reason?: string
    warning?: string
    baseType?: 'absolute' | 'path' | 'none'
  }
}

export interface MockResolverOptions {
  mockBase?: string
  realBase?: string
  pathMap?: Array<{ from: string, to: string }>
  allowHosts?: string[]
  markers?: {
    header?: boolean
    query?: boolean
  }
  env?: {
    useMock?: boolean | string
  }
  storage?: {
    get: () => boolean | undefined
    set: (value: boolean) => void
  }
}

export interface MockResolver {
  resolve: (req: RequestDescriptor) => ResolveResult
  setUseMock: (value: boolean, persist?: boolean) => void
  getUseMock: () => boolean | undefined
}

const markerKeys = {
  header: ['x-mokup', 'x-mock'],
  query: ['mokup', '__mokup'],
  cookie: ['mokup'],
}

function readMarkerFromHeaders(headers: Record<string, string> | undefined): boolean | undefined {
  if (!headers) {
    return undefined
  }
  for (const key of markerKeys.header) {
    const value = getHeaderValue(headers, key)
    const parsed = parseBoolean(value)
    if (typeof parsed === 'boolean') {
      return parsed
    }
  }
  return undefined
}

function readMarkerFromQuery(url: string): boolean | undefined {
  for (const key of markerKeys.query) {
    const value = getQueryParam(url, key)
    const parsed = parseBoolean(value)
    if (typeof parsed === 'boolean') {
      return parsed
    }
  }
  return undefined
}

function readMarkerFromCookie(headers: Record<string, string> | undefined): boolean | undefined {
  if (!headers) {
    return undefined
  }
  for (const key of markerKeys.cookie) {
    const cookie = readCookie(getHeaderValue(headers, 'cookie'), key)
    const parsed = parseBoolean(cookie)
    if (typeof parsed === 'boolean') {
      return parsed
    }
  }
  return undefined
}

function readExplicitMock(req: RequestDescriptor): boolean | undefined {
  const direct = parseBoolean(req.mock)
  if (typeof direct === 'boolean') {
    return direct
  }
  const metaValue = req.meta ? parseBoolean(req.meta.mokup) : undefined
  if (typeof metaValue === 'boolean') {
    return metaValue
  }
  return undefined
}

function parseEnvFlag(value: boolean | string | undefined): boolean | undefined {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return parseBoolean(value)
  }
  return undefined
}

function resolveBaseType(base: string | undefined): 'absolute' | 'path' | 'none' {
  if (!base) {
    return 'none'
  }
  if (isAbsoluteUrl(base)) {
    return 'absolute'
  }
  return 'path'
}

function buildUrl(
  url: string,
  mode: 'mock' | 'real',
  options: MockResolverOptions,
): { url: string, baseType: 'absolute' | 'path' | 'none', warning?: string } {
  const parsed = parseUrl(url)
  if (parsed.isAbsolute && options.allowHosts?.length) {
    const hostAllowed = options.allowHosts.includes(parsed.host ?? '')
      || options.allowHosts.includes(parsed.host?.split(':')[0] ?? '')
    if (!hostAllowed) {
      return { url, baseType: 'none', warning: 'host-not-allowed' }
    }
  }
  const rawBase = mode === 'mock' ? options.mockBase : options.realBase
  const baseType = resolveBaseType(rawBase)
  const mappedPath = applyPathMap(parsed.pathname, options.pathMap)
  const search = parsed.search
  const hash = parsed.hash
  if (baseType === 'absolute') {
    const baseUrl = new URL(rawBase as string)
    const basePath = baseUrl.pathname
    const nextPath = joinPaths(basePath, mappedPath)
    baseUrl.pathname = nextPath
    baseUrl.search = search
    baseUrl.hash = hash
    return { url: baseUrl.toString(), baseType }
  }
  if (baseType === 'path') {
    const basePath = normalizePath(rawBase as string)
    const nextPath = joinPaths(basePath, mappedPath)
    if (parsed.isAbsolute && parsed.origin) {
      return { url: `${parsed.origin}${nextPath}${search}${hash}`, baseType }
    }
    return { url: `${nextPath}${search}${hash}`, baseType }
  }
  if (parsed.isAbsolute && parsed.origin) {
    return { url: `${parsed.origin}${mappedPath}${search}${hash}`, baseType }
  }
  return { url: `${mappedPath}${search}${hash}`, baseType }
}

export function createMockResolver(options: MockResolverOptions = {}): MockResolver {
  let localValue: boolean | undefined
  const storage = options.storage

  const getStored = () => storage?.get()
  const getUseMock = () => localValue ?? getStored()

  const setUseMock = (value: boolean, persist = false) => {
    localValue = value
    if (persist && storage) {
      storage.set(value)
    }
  }

  const resolve = (req: RequestDescriptor): ResolveResult => {
    const headers = normalizeHeaders(req.headers)
    const explicit = readExplicitMock(req)
    const marker = readMarkerFromHeaders(headers) ?? readMarkerFromQuery(req.url) ?? readMarkerFromCookie(headers)
    const globalFlag = getUseMock()
    const envFlag = parseEnvFlag(options.env?.useMock)

    let useMock: boolean = false
    let reason = 'default'

    if (typeof explicit === 'boolean') {
      useMock = explicit
      reason = 'explicit'
    }
    else if (typeof marker === 'boolean') {
      useMock = marker
      reason = 'marker'
    }
    else if (typeof globalFlag === 'boolean') {
      useMock = globalFlag
      reason = 'global'
    }
    else if (typeof envFlag === 'boolean') {
      useMock = envFlag
      reason = 'env'
    }

    const mode = useMock ? 'mock' : 'real'
    const { url, baseType, warning } = buildUrl(req.url, mode, options)

    let nextUrl = url
    if (options.markers?.query && warning !== 'host-not-allowed') {
      nextUrl = appendQueryParam(nextUrl, '__mokup', useMock ? '1' : '0')
    }

    const markerHeaders = options.markers?.header
      ? {
          'x-mokup': useMock ? '1' : '0',
          'x-mokup-mode': mode,
        }
      : undefined

    return {
      mode,
      url: nextUrl,
      headers: mergeHeaders(headers, markerHeaders),
      meta: {
        reason,
        warning,
        baseType,
      },
    }
  }

  return {
    resolve,
    setUseMock,
    getUseMock,
  }
}
