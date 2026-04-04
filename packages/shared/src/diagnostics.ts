export interface DiagnosticSummarySection<TCategory extends string = string> {
  category?: TCategory
  label: string
  items?: string[]
  count?: number
  advice?: string
}

export const routeDiagnosticCatalog = {
  invalidRoute: {
    category: 'invalid-route',
    label: 'invalid route files ignored',
    advice: 'Add a method suffix like .get.ts and avoid unsupported route group segments.',
  },
  unsupportedFields: {
    category: 'unsupported-fields',
    label: 'routes skipped for unsupported rule fields',
    advice: 'Use handler, headers, status, and delay in route rules; do not use legacy response, url, or method fields.',
  },
  missingHandler: {
    category: 'missing-handler',
    label: 'routes skipped without handler',
    advice: 'Export a handler value or function for every enabled rule.',
  },
  duplicateRoute: {
    category: 'duplicate-route',
    label: 'duplicate route definitions',
    advice: 'Keep each method + route path unique across scanned files.',
  },
} as const

export const swConflictDiagnostic = {
  category: 'sw-conflict',
  label: 'service worker config conflicts',
  advice: 'Align sw.path, sw.scope, sw.register, and sw.unregister across entries that use SW mode.',
} as const

function normalizeSections<TCategory extends string>(sections: DiagnosticSummarySection<TCategory>[]) {
  return sections.map((section) => {
    const items = Array.from(
      new Set((section.items ?? []).filter(item => typeof item === 'string' && item.length > 0)),
    )
    const count = section.count ?? items.length
    return {
      ...section,
      items,
      count,
    }
  }).filter(section => section.count > 0)
}

export function buildDiagnosticSummaryLines<TCategory extends string>(params: {
  title?: string
  sections: DiagnosticSummarySection<TCategory>[]
  maxItems?: number
}) {
  const title = params.title ?? 'Mokup diagnostics summary'
  const maxItems = params.maxItems ?? 3
  const sections = normalizeSections(params.sections)

  if (sections.length === 0) {
    return []
  }

  const lines = [
    `${title}: ${sections.map(section => `${section.count} ${section.label}`).join('; ')}`,
  ]

  for (const section of sections) {
    if (section.items.length > 0) {
      const preview = section.items.slice(0, maxItems)
      const remaining = section.items.length - preview.length
      lines.push(
        `${section.label}: ${preview.join(', ')}${remaining > 0 ? ` (+${remaining} more)` : ''}`,
      )
    }
    if (section.advice) {
      lines.push(`Fix: ${section.advice}`)
    }
  }

  return lines
}

function matchesErrorMode<TCategory extends string>(
  category: TCategory | undefined,
  errorOn: 'all' | TCategory[] | undefined,
) {
  if (!category || !errorOn) {
    return false
  }
  if (errorOn === 'all') {
    return true
  }
  return errorOn.includes(category)
}

export function createDiagnosticError<TCategory extends string>(params: {
  errorOn?: 'all' | TCategory[]
  sections: DiagnosticSummarySection<TCategory>[]
  title?: string
  maxItems?: number
}) {
  const failingSections = normalizeSections(params.sections)
    .filter(section => matchesErrorMode(section.category, params.errorOn))
  if (failingSections.length === 0) {
    return null
  }
  const buildParams: Parameters<typeof buildDiagnosticSummaryLines<TCategory>>[0] = {
    title: params.title ?? 'Mokup diagnostics error',
    sections: failingSections,
  }
  if (typeof params.maxItems === 'number') {
    buildParams.maxItems = params.maxItems
  }
  return new Error(buildDiagnosticSummaryLines(buildParams).join('\n'))
}
