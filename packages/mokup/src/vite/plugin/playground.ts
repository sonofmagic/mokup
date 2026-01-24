import type { ViteDevServer } from 'vite'
import pc from 'picocolors'
import { formatOutputLine, stripAnsi } from '../../shared/terminal'
import { formatPlaygroundUrl } from './paths'

const arrowToken = '➜'
const playgroundLabel = 'Mokup Playground'
const coloredArrow = pc.green(arrowToken)
const formatOptions = {
  arrowToken,
  formattedArrow: coloredArrow,
  labels: [playgroundLabel],
  formatLabel: pc.bold,
  formatPort: pc.bold,
}

function patchPlaygroundPrintUrls(server: ViteDevServer, playgroundPath: string) {
  const originalPrintUrls = server.printUrls.bind(server)
  const patchPrintUrls = () => {
    const logger = server.config.logger
    const originalInfo = logger.info
    const lines: Array<Parameters<typeof logger.info>> = []
    const captureInfo = ((...args: Parameters<typeof logger.info>) => {
      lines.push(args)
    }) as typeof logger.info
    Object.defineProperty(logger, 'info', {
      configurable: true,
      value: captureInfo,
    })
    try {
      originalPrintUrls()
    }
    finally {
      Object.defineProperty(logger, 'info', {
        configurable: true,
        value: originalInfo,
      })
    }
    const localUrl = server.resolvedUrls?.local?.[0]
    const outputUrl = formatPlaygroundUrl(localUrl, playgroundPath)
    const coloredUrl = pc.magenta(outputUrl)
    const playgroundLine = `  ${arrowToken}  ${playgroundLabel}: ${coloredUrl}`
    const arrowPrefix = `  ${arrowToken}  `
    const findIndex = (needle: string) =>
      lines.findIndex(args => stripAnsi(args[0]).includes(needle))
    const networkIndex = findIndex(`${arrowPrefix}Network:`)
    const localIndex = findIndex(`${arrowPrefix}Local:`)
    const insertIndex = networkIndex >= 0
      ? networkIndex + 1
      : localIndex >= 0
        ? localIndex + 1
        : lines.length
    const outputLines = lines.slice()
    outputLines.splice(insertIndex, 0, [playgroundLine])
    for (const args of outputLines) {
      if (typeof args[0] === 'string') {
        const nextArgs = args.slice() as typeof args
        nextArgs[0] = formatOutputLine(nextArgs[0], formatOptions)
        originalInfo(...nextArgs)
      }
      else {
        originalInfo(...args)
      }
    }
  }
  Object.defineProperty(server, 'printUrls', {
    configurable: true,
    value: patchPrintUrls,
  })
}

export { patchPlaygroundPrintUrls }
