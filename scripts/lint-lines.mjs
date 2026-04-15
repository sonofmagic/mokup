import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const packagesDir = path.join(root, 'packages')
const MAX_LINES = 300
const VALID_MODES = new Set(['error', 'warn'])
const MODE_ARG_RE = /^--mode=/
const NEWLINE_RE = /\r?\n/
const allowedExts = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.mts',
  '.cts',
  '.vue',
])
const skipDirs = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.turbo',
])

function parseMode(argv) {
  for (const arg of argv.slice(2)) {
    if (MODE_ARG_RE.test(arg)) {
      return arg.slice('--mode='.length)
    }
  }
  return 'error'
}

function isCommentLine(line) {
  const trimmed = line.trim()
  if (trimmed.startsWith('//')) {
    return true
  }
  if (trimmed.startsWith('/*')) {
    const endIdx = trimmed.indexOf('*/', 2)
    if (endIdx === -1) {
      return true
    }
    return trimmed.slice(endIdx + 2).trim().length === 0
  }
  if (trimmed.startsWith('*/') || trimmed.startsWith('*')) {
    return true
  }
  if (trimmed.startsWith('<!--')) {
    const endIdx = trimmed.indexOf('-->', 4)
    if (endIdx === -1) {
      return true
    }
    return trimmed.slice(endIdx + 3).trim().length === 0
  }
  return false
}

async function walk(dir, files) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name) || entry.name.startsWith('.')) {
        continue
      }
      await walk(path.join(dir, entry.name), files)
      continue
    }
    if (entry.isFile()) {
      files.push(path.join(dir, entry.name))
    }
  }
}

async function main() {
  const mode = parseMode(process.argv)
  if (!VALID_MODES.has(mode)) {
    process.stderr.write(`lint:lines failed: invalid mode "${mode}", expected one of: ${Array.from(VALID_MODES).join(', ')}\n`)
    process.exit(1)
  }

  const files = []
  await walk(packagesDir, files)
  const targets = files.filter((file) => {
    if (!allowedExts.has(path.extname(file))) {
      return false
    }
    const parts = file.split(path.sep)
    return parts.includes('src')
  })

  const violations = []
  for (const file of targets) {
    const content = await fs.readFile(file, 'utf8')
    const lines = content.split(NEWLINE_RE)
    let count = 0
    for (const line of lines) {
      if (isCommentLine(line)) {
        continue
      }
      count += 1
    }
    if (count > MAX_LINES) {
      violations.push({ file, count })
    }
  }

  if (violations.length > 0) {
    const formatted = violations
      .sort((a, b) => b.count - a.count)
      .map(entry => `- ${path.relative(root, entry.file)}: ${entry.count}`)
      .join('\n')
    const summary = `Files over ${MAX_LINES} lines (${violations.length}):\n${formatted}\n`
    if (mode === 'warn') {
      process.stdout.write(`lint:lines warn.\n${summary}`)
      return
    }
    process.stderr.write(`lint:lines failed.\n${summary}`)
    process.exit(1)
  }
  process.stdout.write(`lint:lines ok (${targets.length} files checked, max=${MAX_LINES}, mode=${mode})\n`)
}

main().catch((error) => {
  process.stderr.write(`lint:lines failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})
