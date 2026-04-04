import { promises as fs } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const expectedNodeRange = '^20.19.0 || >=22.12.0'
const expectedRolldownVersion = '1.0.0-rc.13'
const allowedScanExtensions = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.mts',
  '.cjs',
  '.cts',
  '.json',
  '.yaml',
  '.yml',
])
const skipDirs = new Set([
  '.git',
  '.turbo',
  '.wrangler',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
])
const skipFiles = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
])
const scanRoots = ['apps', 'packages', 'scripts', '.github', '.changeset']
const skippedScanFiles = new Set([
  'scripts/check-migration-guards.mjs',
])
const DIRECT_ESBUILD_IMPORT_RE = /from\s+['"]esbuild['"]/
const DIRECT_ESBUILD_DYNAMIC_IMPORT_RE = /import\s*\(\s*['"]esbuild['"]\s*\)/
const DIRECT_ESBUILD_REQUIRE_RE = /require\s*\(\s*['"]esbuild['"]\s*\)/
const LEGACY_TSUP_RE = /\btsup\b/
const LEGACY_UNBUILD_RE = /\bunbuild\b/
const LEGACY_BUILD_CONFIG_RE = /\bbuild\.config\.(?:ts|js|mjs|mts|cjs|cts)\b/
const forbiddenContentRules = [
  {
    id: 'shared-esbuild-entry',
    test: content => content.includes('@mokup/shared/esbuild'),
    message: 'Use @mokup/shared/rolldown instead of the removed @mokup/shared/esbuild entry.',
  },
  {
    id: 'direct-esbuild-import',
    test: content =>
      DIRECT_ESBUILD_IMPORT_RE.test(content)
      || DIRECT_ESBUILD_DYNAMIC_IMPORT_RE.test(content)
      || DIRECT_ESBUILD_REQUIRE_RE.test(content),
    message: 'Direct esbuild imports are forbidden in repository code and config.',
  },
  {
    id: 'legacy-tsup-config',
    test: content =>
      LEGACY_TSUP_RE.test(content)
      || LEGACY_UNBUILD_RE.test(content)
      || LEGACY_BUILD_CONFIG_RE.test(content),
    message: 'Legacy tsup/unbuild build-chain references are forbidden outside migration docs.',
  },
]

function toRelative(file) {
  return path.relative(rootDir, file)
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function pathExists(file) {
  try {
    await fs.access(file)
    return true
  }
  catch {
    return false
  }
}

function shouldSkipPath(file) {
  const relative = toRelative(file)
  if (!relative || relative.startsWith(`..${path.sep}`)) {
    return true
  }
  if (skippedScanFiles.has(relative)) {
    return true
  }
  if (skipFiles.has(path.basename(file))) {
    return true
  }
  return relative.split(path.sep).some(segment => skipDirs.has(segment))
}

async function walk(dir, files) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) {
        continue
      }
      await walk(file, files)
      continue
    }
    if (!entry.isFile()) {
      continue
    }
    if (shouldSkipPath(file)) {
      continue
    }
    if (!allowedScanExtensions.has(path.extname(file))) {
      continue
    }
    files.push(file)
  }
}

function isPublishablePackageJson(relativeFile, pkg) {
  return relativeFile.startsWith(`packages${path.sep}`) && pkg.private !== true
}

function isLibraryPackage(pkg) {
  return Boolean(pkg.exports || pkg.types || pkg.main || pkg.module)
}

function collectExportTargets(value, targets) {
  if (typeof value === 'string') {
    targets.push(value)
    return
  }
  if (!value || typeof value !== 'object') {
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'require') {
      targets.push('__require_condition__')
      continue
    }
    collectExportTargets(child, targets)
  }
}

function checkPackageExports(relativeFile, pkg, violations) {
  const targets = []
  collectExportTargets(pkg.exports, targets)
  if (targets.includes('__require_condition__')) {
    violations.push(`${relativeFile}: publishable packages must not expose a require export condition`)
  }
  for (const target of targets) {
    if (target === '__require_condition__') {
      continue
    }
    if (typeof target !== 'string') {
      continue
    }
    if (target.endsWith('.cjs') || target.endsWith('.cts') || target.endsWith('.js')) {
      violations.push(`${relativeFile}: export target "${target}" must stay ESM-only`)
    }
  }
}

function checkPackageScripts(relativeFile, pkg, violations) {
  if (!isLibraryPackage(pkg)) {
    return
  }
  const buildScript = pkg.scripts?.build
  if (buildScript !== 'tsdown') {
    violations.push(`${relativeFile}: publishable package build script must be "tsdown"`)
  }
  const devScript = pkg.scripts?.dev
  if (typeof devScript === 'string' && !devScript.startsWith('tsdown --watch')) {
    violations.push(`${relativeFile}: publishable package dev script must use "tsdown --watch"`)
  }
}

function checkPackageDeps(relativeFile, pkg, violations) {
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    const deps = pkg[field]
    if (!deps || typeof deps !== 'object') {
      continue
    }
    for (const depName of Object.keys(deps)) {
      if (depName === 'esbuild' || depName === 'tsup' || depName === 'unbuild') {
        violations.push(`${relativeFile}: publishable package must not depend on ${depName}`)
      }
    }
  }
}

function checkPackageMeta(relativeFile, pkg, violations) {
  if (pkg.type !== 'module') {
    violations.push(`${relativeFile}: publishable package type must be "module"`)
  }
  if (pkg.engines?.node !== expectedNodeRange) {
    violations.push(`${relativeFile}: publishable package engines.node must be "${expectedNodeRange}"`)
  }
}

async function main() {
  const violations = []
  const packageJsonFiles = []
  const scanFiles = []

  for (const rootName of scanRoots) {
    const dir = path.join(rootDir, rootName)
    if (await pathExists(dir)) {
      await walk(dir, scanFiles)
    }
  }

  const packageDirs = [
    path.join(rootDir, 'packages'),
    path.join(rootDir, 'apps'),
  ]
  for (const dir of packageDirs) {
    if (!await pathExists(dir)) {
      continue
    }
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }
      const packageJsonFile = path.join(dir, entry.name, 'package.json')
      if (await pathExists(packageJsonFile)) {
        packageJsonFiles.push(packageJsonFile)
      }
    }
  }

  for (const file of scanFiles) {
    const content = await fs.readFile(file, 'utf8')
    const relativeFile = toRelative(file)
    for (const rule of forbiddenContentRules) {
      if (rule.test(content)) {
        violations.push(`${relativeFile}: ${rule.message}`)
      }
    }
  }

  for (const file of packageJsonFiles) {
    const pkg = await readJson(file)
    const relativeFile = toRelative(file)
    if (!isPublishablePackageJson(relativeFile, pkg)) {
      continue
    }
    checkPackageMeta(relativeFile, pkg, violations)
    checkPackageScripts(relativeFile, pkg, violations)
    checkPackageDeps(relativeFile, pkg, violations)
    checkPackageExports(relativeFile, pkg, violations)
  }

  const rootPackage = await readJson(path.join(rootDir, 'package.json'))
  if (rootPackage.engines?.node !== expectedNodeRange) {
    violations.push(`package.json: root engines.node must be "${expectedNodeRange}"`)
  }
  if (rootPackage.pnpm?.overrides?.rolldown !== expectedRolldownVersion) {
    violations.push(`package.json: root pnpm.overrides.rolldown must stay pinned to "${expectedRolldownVersion}"`)
  }

  if (violations.length > 0) {
    const formatted = violations
      .sort((a, b) => a.localeCompare(b))
      .map(entry => `- ${entry}`)
      .join('\n')
    process.stderr.write(`migration guards failed:\n${formatted}\n`)
    process.exit(1)
  }

  process.stdout.write(`migration guards ok (${packageJsonFiles.length} package.json files checked)\n`)
}

main().catch((error) => {
  process.stderr.write(`migration guards failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`)
  process.exit(1)
})
