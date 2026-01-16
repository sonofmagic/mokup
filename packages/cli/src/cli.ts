#!/usr/bin/env node
import { argv, exit } from 'node:process'

import { buildManifest } from './index'

function parseBuildOptions(argv: string[]) {
  const dirs: string[] = []
  const includes: RegExp[] = []
  const excludes: RegExp[] = []
  let outDir: string | undefined
  let prefix: string | undefined
  let handlers = true

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dir' || arg === '-d') {
      const value = argv[i + 1]
      if (value) {
        dirs.push(value)
        i += 1
      }
      continue
    }
    if (arg === '--out' || arg === '-o') {
      const value = argv[i + 1]
      if (value) {
        outDir = value
        i += 1
      }
      continue
    }
    if (arg === '--prefix') {
      const value = argv[i + 1]
      if (value) {
        prefix = value
        i += 1
      }
      continue
    }
    if (arg === '--include') {
      const value = argv[i + 1]
      if (value) {
        includes.push(new RegExp(value))
        i += 1
      }
      continue
    }
    if (arg === '--exclude') {
      const value = argv[i + 1]
      if (value) {
        excludes.push(new RegExp(value))
        i += 1
      }
      continue
    }
    if (arg === '--no-handlers') {
      handlers = false
      continue
    }
  }

  return {
    dir: dirs.length ? dirs : undefined,
    outDir,
    prefix,
    include: includes.length ? includes : undefined,
    exclude: excludes.length ? excludes : undefined,
    handlers,
    log: (message: string) => console.log(message),
  }
}

function printHelp() {
  console.log(
    `moku build [options]\n\nOptions:\n  --dir, -d       Mock directory (repeatable)\n  --out, -o       Output directory (default: dist)\n  --prefix        URL prefix\n  --include       Include regex (repeatable)\n  --exclude       Exclude regex (repeatable)\n  --no-handlers   Skip function handler output`,
  )
}

const args = argv.slice(2)
const command = args[0]

if (!command || command === 'help' || command === '--help' || command === '-h') {
  printHelp()
  exit(0)
}

if (command !== 'build') {
  console.error(`Unknown command: ${command}`)
  printHelp()
  exit(1)
}

const options = parseBuildOptions(args.slice(1))

buildManifest(options)
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    exit(1)
  })
