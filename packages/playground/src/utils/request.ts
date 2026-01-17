export function parseJsonInput(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return { value: undefined as Record<string, unknown> | undefined }
  }
  try {
    return { value: JSON.parse(trimmed) as Record<string, unknown> }
  }
  catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid JSON' }
  }
}

export function applyQuery(url: URL, query: Record<string, unknown>) {
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'undefined') {
      continue
    }
    if (Array.isArray(value)) {
      value.forEach(item => url.searchParams.append(key, String(item)))
    }
    else {
      url.searchParams.set(key, String(value))
    }
  }
}
