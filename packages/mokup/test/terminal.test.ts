import { describe, expect, it } from 'vitest'
import { formatOutputLine, stripAnsi } from '../src/shared/terminal'

describe('terminal formatting', () => {
  it('strips ansi escape sequences', () => {
    const input = '\u001B[31mred\u001B[0m text'
    expect(stripAnsi(input)).toBe('red text')
  })

  it('formats arrows, labels, and ports', () => {
    const line = '  -> Local: http://localhost:5173/'
    const formatted = formatOutputLine(line, {
      arrowToken: '->',
      formattedArrow: '=>',
      labels: ['Local'],
      formatLabel: label => `[${label}]`,
      formatPort: port => `#${port}`,
    })
    expect(formatted).toContain('=>')
    expect(formatted).toContain('[Local]')
    expect(formatted).toContain(':#5173')
  })

  it('returns the original line when formatters are missing', () => {
    const line = '  -> Local: http://localhost:5173/'
    const formatted = formatOutputLine(line, { arrowToken: '->' })
    expect(formatted).toBe(line)
  })

  it('ignores labels without a formatter', () => {
    const line = 'Local: http://localhost:5173/'
    const formatted = formatOutputLine(line, { arrowToken: '->', labels: ['Local'] })
    expect(formatted).toBe(line)
  })
})
