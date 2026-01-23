export interface Logger {
  info: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
  log: (...args: unknown[]) => void
}

export interface LoggerOptions {
  enabled?: boolean
  tag?: string
}
