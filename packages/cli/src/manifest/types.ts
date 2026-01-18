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
  url?: string
  method?: string
  response: unknown
  status?: number
  headers?: Record<string, string>
  delay?: number
}

export interface FileInfo {
  file: string
  rootDir: string
}
