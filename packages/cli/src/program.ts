import type { MokupNodeServerOptions } from '@mokup/server'
import type { BuildOptions } from './manifest/types'
import process from 'node:process'
import { startMokupServer } from '@mokup/server'
import { Command } from 'commander'
import { buildManifest } from './manifest'

function collectValues(value: string, previous: string[] | undefined) {
  return [...(previous ?? []), value]
}

function collectRegex(value: string, previous: RegExp[] | undefined) {
  const next = previous ?? []
  next.push(new RegExp(value))
  return next
}

function toBuildOptions(options: {
  dir?: string[]
  out?: string
  prefix?: string
  include?: RegExp[]
  exclude?: RegExp[]
  handlers?: boolean
}) {
  const buildOptions: BuildOptions = {
    handlers: options.handlers !== false,
    log: (message: string) => {
      console.log(message)
    },
  }
  if (options.dir && options.dir.length > 0) {
    buildOptions.dir = options.dir
  }
  if (options.out) {
    buildOptions.outDir = options.out
  }
  if (options.prefix) {
    buildOptions.prefix = options.prefix
  }
  if (options.include && options.include.length > 0) {
    buildOptions.include = options.include
  }
  if (options.exclude && options.exclude.length > 0) {
    buildOptions.exclude = options.exclude
  }
  return buildOptions
}

function toServeOptions(options: {
  dir?: string[]
  prefix?: string
  include?: RegExp[]
  exclude?: RegExp[]
  host?: string
  port?: string
  watch?: boolean
  playground?: boolean
  log?: boolean
}): MokupNodeServerOptions {
  const serveOptions: MokupNodeServerOptions = {
    watch: options.watch !== false,
    log: options.log !== false,
  }
  if (options.dir && options.dir.length > 0) {
    serveOptions.dir = options.dir
  }
  if (options.prefix) {
    serveOptions.prefix = options.prefix
  }
  if (options.include && options.include.length > 0) {
    serveOptions.include = options.include
  }
  if (options.exclude && options.exclude.length > 0) {
    serveOptions.exclude = options.exclude
  }
  if (options.host) {
    serveOptions.host = options.host
  }
  if (typeof options.port === 'string' && options.port.length > 0) {
    const parsed = Number(options.port)
    if (!Number.isFinite(parsed)) {
      throw new TypeError(`Invalid port: ${options.port}`)
    }
    serveOptions.port = parsed
  }
  if (typeof options.playground !== 'undefined') {
    serveOptions.playground = options.playground
  }
  return serveOptions
}

export function createCli() {
  const program = new Command()
  program
    .name('mokup')
    .description('Mock utilities for file-based routes.')
    .showHelpAfterError()

  program
    .command('build')
    .description('Generate .mokup build output')
    .option('-d, --dir <dir>', 'Mock directory (repeatable)', collectValues)
    .option('-o, --out <dir>', 'Output directory (default: .mokup)')
    .option('--prefix <prefix>', 'URL prefix')
    .option('--include <pattern>', 'Include regex (repeatable)', collectRegex)
    .option('--exclude <pattern>', 'Exclude regex (repeatable)', collectRegex)
    .option('--no-handlers', 'Skip function handler output')
    .action(async (options) => {
      const buildOptions = toBuildOptions(options)
      await buildManifest(buildOptions)
    })

  program
    .command('serve')
    .description('Start a Node.js mock server')
    .option('-d, --dir <dir>', 'Mock directory (repeatable)', collectValues)
    .option('--prefix <prefix>', 'URL prefix')
    .option('--include <pattern>', 'Include regex (repeatable)', collectRegex)
    .option('--exclude <pattern>', 'Exclude regex (repeatable)', collectRegex)
    .option('--host <host>', 'Hostname (default: localhost)')
    .option('--port <port>', 'Port (default: 8080)')
    .option('--no-watch', 'Disable file watching')
    .option('--no-playground', 'Disable Playground')
    .option('--no-log', 'Disable logging')
    .action(async (options) => {
      const serveOptions = toServeOptions(options)
      const server = await startMokupServer(serveOptions)
      const shutdown = async () => {
        try {
          await server.close()
        }
        finally {
          process.exit(0)
        }
      }
      process.on('SIGINT', shutdown)
      process.on('SIGTERM', shutdown)
    })

  program
    .command('help')
    .description('Show help')
    .action(() => {
      program.help()
    })

  return program
}

export async function runCli(argv = process.argv) {
  const program = createCli()
  if (argv.length <= 2) {
    program.help()
    return
  }
  await program.parseAsync(argv)
}
