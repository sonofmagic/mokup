function buildQueryString(query: Record<string, unknown>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'undefined') {
      continue
    }
    if (Array.isArray(value)) {
      value.forEach(item => params.append(key, String(item)))
    }
    else {
      params.set(key, String(value))
    }
  }
  const search = params.toString()
  return search ? `?${search}` : ''
}

function parseKeyValueInput(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return []
  }
  const parts = trimmed.split(/[&\r\n]/)
  const entries: Array<[string, string]> = []
  for (const part of parts) {
    const segment = part.trim()
    if (!segment) {
      continue
    }
    const [key, ...rest] = segment.split('=')
    const normalizedKey = (key ?? '').trim()
    if (!normalizedKey) {
      continue
    }
    const value = rest.join('=').trim()
    entries.push([normalizedKey, value])
  }
  return entries
}

export { buildQueryString, parseKeyValueInput }
