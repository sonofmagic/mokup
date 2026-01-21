import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from '@playwright/test'
import { runCommand } from './utils/command'
import { ensureEmptyDir } from './utils/fs'
import { repoRoot } from './utils/paths'

test('mokup build emits manifest and bundle outputs', async (_context, testInfo) => {
  const outDir = testInfo.outputPath('cli-worker')
  await ensureEmptyDir(outDir)

  await runCommand(
    'pnpm',
    ['exec', 'mokup', 'build', '--dir', 'apps/web/mock', '--out', outDir],
    { cwd: repoRoot },
  )

  await stat(join(outDir, 'mokup.manifest.json'))
  await stat(join(outDir, 'mokup.manifest.mjs'))
  await stat(join(outDir, 'mokup.manifest.d.mts'))
  await stat(join(outDir, 'mokup.bundle.mjs'))
  await stat(join(outDir, 'mokup.bundle.d.ts'))
  await stat(join(outDir, 'mokup.bundle.d.mts'))
  await stat(join(outDir, 'mokup-handlers'))

  const manifestModule = await import(
    pathToFileURL(join(outDir, 'mokup.manifest.mjs')).href,
  )
  expect(manifestModule.default.routes.length).toBeGreaterThan(0)

  const bundleModule = await import(
    pathToFileURL(join(outDir, 'mokup.bundle.mjs')).href,
  )
  expect(bundleModule.default.manifest.routes.length).toBeGreaterThan(0)
})
