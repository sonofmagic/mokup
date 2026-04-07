export type SearchField = 'text' | 'method' | 'path' | 'file' | 'group' | 'reason'

export interface SearchToken {
  field: SearchField
  value: string
}

export interface HighlightPart {
  text: string
  highlight: boolean
}

const SEARCH_TOKEN_SPLIT_PATTERN = /\s+/
const SEARCH_FIELD_PATTERN = /^([a-z]+)(:|=)(.+)$/i

function resolveSearchField(key: string): SearchField | null {
  switch (key.toLowerCase()) {
    case 'method':
    case 'm':
      return 'method'
    case 'path':
    case 'url':
    case 'route':
      return 'path'
    case 'file':
    case 'f':
      return 'file'
    case 'group':
    case 'g':
      return 'group'
    case 'reason':
    case 'r':
      return 'reason'
    default:
      return null
  }
}

export function parseSearchTokens(raw: string): SearchToken[] {
  const trimmed = raw.trim()
  if (!trimmed) {
    return []
  }
  const tokens: SearchToken[] = []
  for (const part of trimmed.split(SEARCH_TOKEN_SPLIT_PATTERN)) {
    if (!part) {
      continue
    }
    const match = part.match(SEARCH_FIELD_PATTERN)
    if (!match) {
      tokens.push({ field: 'text', value: part.toLowerCase() })
      continue
    }
    const key = match[1]
    const value = match[3]
    if (!key || !value) {
      tokens.push({ field: 'text', value: part.toLowerCase() })
      continue
    }
    const normalized = value.trim()
    if (!normalized) {
      tokens.push({ field: 'text', value: part.toLowerCase() })
      continue
    }
    const field = resolveSearchField(key)
    if (!field) {
      tokens.push({ field: 'text', value: part.toLowerCase() })
      continue
    }
    tokens.push({ field, value: normalized.toLowerCase() })
  }
  return tokens
}

export function extractSearchValues(raw: string): string[] {
  const values = parseSearchTokens(raw).map(token => token.value).filter(Boolean)
  return [...new Set(values)]
}

export function buildHighlightParts(text: string, tokens: string[]): HighlightPart[] {
  if (!text) {
    return [{ text: '', highlight: false }]
  }
  if (!tokens.length) {
    return [{ text, highlight: false }]
  }
  const lower = text.toLowerCase()
  const ranges: Array<[number, number]> = []
  for (const token of tokens) {
    if (!token) {
      continue
    }
    let startIndex = 0
    while (startIndex < lower.length) {
      const index = lower.indexOf(token, startIndex)
      if (index === -1) {
        break
      }
      ranges.push([index, index + token.length])
      startIndex = index + token.length
    }
  }
  if (!ranges.length) {
    return [{ text, highlight: false }]
  }
  ranges.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]))
  const merged: Array<[number, number]> = []
  for (const [start, end] of ranges) {
    const last = merged.at(-1)
    if (!last || start > last[1]) {
      merged.push([start, end])
    }
    else {
      last[1] = Math.max(last[1], end)
    }
  }
  const parts: HighlightPart[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (cursor < start) {
      parts.push({ text: text.slice(cursor, start), highlight: false })
    }
    parts.push({ text: text.slice(start, end), highlight: true })
    cursor = end
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), highlight: false })
  }
  return parts
}
