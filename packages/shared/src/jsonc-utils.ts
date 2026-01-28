import { promises as fs } from 'node:fs'

import { parse as parseJsonc } from './jsonc-parser'

export interface JsoncLogger {
  warn?: (message: string) => void
}

export async function readJsoncFile(
  file: string,
  logger?: JsoncLogger,
) {
  try {
    const content = await fs.readFile(file, 'utf8')
    const errors: { error: number, offset: number, length: number }[] = []
    const data = parseJsonc(content, errors, {
      allowTrailingComma: true,
      disallowComments: false,
    })
    if (errors.length > 0) {
      logger?.warn?.(`Invalid JSONC in ${file}`)
      return undefined
    }
    return data
  }
  catch (error) {
    logger?.warn?.(`Failed to read ${file}: ${String(error)}`)
    return undefined
  }
}
