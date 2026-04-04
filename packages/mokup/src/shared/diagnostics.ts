interface DiagnosticSummarySection {
  label: string
  items?: string[]
  count?: number
  advice?: string
}

export function buildDiagnosticSummaryLines(params: {
  title?: string
  sections: DiagnosticSummarySection[]
  maxItems?: number
}) {
  const title = params.title ?? 'Mokup diagnostics summary'
  const maxItems = params.maxItems ?? 3

  const sections = params.sections.map((section) => {
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
