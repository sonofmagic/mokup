const portPattern = /:(?<port>\d{2,5})/g
const escapeCode = 27

interface FormatOutputOptions {
  arrowToken: string
  formattedArrow?: string
  labels?: string[]
  formatLabel?: (label: string) => string
  formatPort?: (port: string) => string
}

function stripAnsi(value: string) {
  let output = ''
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code === escapeCode && value[index + 1] === '[') {
      index += 1
      while (index < value.length && value[index] !== 'm') {
        index += 1
      }
      continue
    }
    output += value[index]
  }
  return output
}

function formatOutputLine(line: string, options: FormatOutputOptions) {
  const { arrowToken, formattedArrow, labels, formatLabel, formatPort } = options
  let output = formattedArrow ? line.replaceAll(arrowToken, formattedArrow) : line
  if (labels && formatLabel) {
    for (const label of labels) {
      output = output.replaceAll(label, formatLabel(label))
    }
  }
  if (formatPort) {
    output = output.replace(portPattern, (_match, port: string) => `:${formatPort(port)}`)
  }
  return output
}

export { formatOutputLine, stripAnsi }
