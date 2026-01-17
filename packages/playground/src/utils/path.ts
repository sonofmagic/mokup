export function normalizeBasePath(pathname: string) {
  const trimmed = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  if (trimmed === '/') {
    return ''
  }
  return trimmed.endsWith('/index.html')
    ? trimmed.slice(0, -'/index.html'.length)
    : trimmed
}

export function toPosixPath(value: string) {
  return value.replace(/\\/g, '/')
}
