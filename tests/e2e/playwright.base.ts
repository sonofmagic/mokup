import process from 'node:process'
import { defineConfig } from '@playwright/test'

interface BaseConfigOptions {
  testDir: string
}

export function createPlaywrightConfig(options: BaseConfigOptions) {
  const isCI = Boolean(process.env.CI)
  const baseURL = process.env.E2E_BASE_URL
  if (!baseURL) {
    throw new Error('E2E_BASE_URL is required. Run via pnpm test:e2e to provision it.')
  }

  return defineConfig({
    testDir: options.testDir,
    timeout: 60_000,
    expect: {
      timeout: 10_000,
    },
    fullyParallel: true,
    forbidOnly: isCI,
    reporter: [['list']],
    use: {
      browserName: 'chromium',
      baseURL,
      trace: 'retain-on-failure',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
    },
  })
}
