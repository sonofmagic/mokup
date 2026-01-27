import { mkdir, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { writePlaygroundBuild } from '../src/core/playground/build'

const missingDist = join(tmpdir(), 'mokup-missing-playground-dist')

vi.mock('../src/core/playground/assets', () => ({
  resolvePlaygroundDist: () => missingDist,
}))

describe('playground build errors', () => {
  it('bails out when output matches outDir', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-playground-error-'))
    const outDir = join(root, 'dist')
    await mkdir(outDir, { recursive: true })

    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), log: vi.fn() }
    await writePlaygroundBuild({
      outDir,
      base: '/',
      playgroundPath: '/',
      root,
      routes: [],
      disabledRoutes: [],
      ignoredRoutes: [],
      configFiles: [],
      disabledConfigFiles: [],
      dirs: [],
      swScript: null,
      logger,
    })

    expect(logger.error).toHaveBeenCalled()
  })

  it('logs when playground assets are missing', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mokup-playground-error-'))
    const outDir = join(root, 'dist')

    const logger = { error: vi.fn(), warn: vi.fn(), info: vi.fn(), log: vi.fn() }
    await writePlaygroundBuild({
      outDir,
      base: '/',
      playgroundPath: '/__mokup',
      root,
      routes: [],
      disabledRoutes: [],
      ignoredRoutes: [],
      configFiles: [],
      disabledConfigFiles: [],
      dirs: [],
      swScript: null,
      logger,
    })

    expect(logger.error).toHaveBeenCalled()
  })
})
