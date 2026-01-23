import type { ViteDevServer } from 'vite'
import pc from 'picocolors'
import { formatPlaygroundUrl } from './paths'

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
    const playgroundLine = `  ➜  Mokup Playground: ${coloredUrl}`
    const ansiEscape = '\u001B'
    const ansiPattern = new RegExp(`${ansiEscape}\\[[0-9;]*m`, 'g')
    const stripAnsi = (value: string) => value.replace(ansiPattern, '')
    const findIndex = (needle: string) =>
      lines.findIndex(args => stripAnsi(args[0]).includes(needle))
    const networkIndex = findIndex('  ➜  Network:')
    const localIndex = findIndex('  ➜  Local:')
    const insertIndex = networkIndex >= 0
      ? networkIndex + 1
      : localIndex >= 0
        ? localIndex + 1
        : lines.length
    const outputLines = lines.slice()
    outputLines.splice(insertIndex, 0, [playgroundLine])
    for (const args of outputLines) {
      originalInfo(...args)
    }
  }
  Object.defineProperty(server, 'printUrls', {
    configurable: true,
    value: patchPrintUrls,
  })
}

export { patchPlaygroundPrintUrls }
