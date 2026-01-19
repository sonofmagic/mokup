export interface BuildOptions {
  dir?: string | string[]
  outDir?: string
  prefix?: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  handlers?: boolean
  root?: string
  log?: (message: string) => void
}

export interface MockRule {
  handler: unknown
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export type MockMiddleware = (
  req: unknown,
  res: unknown,
  ctx: unknown,
  next: () => Promise<unknown>,
) => unknown | Promise<unknown>

export interface DirectoryConfig {
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
  middleware?: MockMiddleware | MockMiddleware[]
}

export interface FileInfo {
  file: string
  rootDir: string
}
