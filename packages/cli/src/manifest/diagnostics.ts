import type { DiagnosticCategory, DiagnosticErrorMode } from './types'

interface DiagnosticSummarySection {
  category?: DiagnosticCategory
  label: string
  items?: string[]
  count?: number
  advice?: string
}

function normalizeSections(sections: DiagnosticSummarySection[]) {
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

export function buildDiagnosticSummaryLines(params: {
  title?: string
  sections: DiagnosticSummarySection[]
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

function matchesErrorMode(category: DiagnosticCategory | undefined, errorOn: DiagnosticErrorMode | undefined) {
  if (!category || !errorOn) {
    return false
  }
  if (errorOn === 'all') {
    return true
  }
  return errorOn.includes(category)
}

export function createDiagnosticError(params: {
  errorOn?: DiagnosticErrorMode
  sections: DiagnosticSummarySection[]
  title?: string
  maxItems?: number
}) {
  const failingSections = normalizeSections(params.sections)
    .filter(section => matchesErrorMode(section.category, params.errorOn))
  if (failingSections.length === 0) {
    return null
  }
  const buildParams: Parameters<typeof buildDiagnosticSummaryLines>[0] = {
    title: params.title ?? 'Mokup diagnostics error',
    sections: failingSections,
  }
  if (typeof params.maxItems === 'number') {
    buildParams.maxItems = params.maxItems
  }
  return new Error(buildDiagnosticSummaryLines(buildParams).join('\n'))
}
