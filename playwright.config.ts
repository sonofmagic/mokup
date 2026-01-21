import process from 'node:process'
import { defineConfig } from '@playwright/test'
import { WEB_PORT } from './tests/e2e/constants'

const isCI = Boolean(process.env.CI)
const webBaseURL = `http://127.0.0.1:${WEB_PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: isCI,
  reporter: [['list']],
  use: {
    browserName: 'chromium',
    baseURL: webBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testMatch: /ui\.spec\.ts/,
      use: {
        baseURL: webBaseURL,
      },
    },
    {
      name: 'playground',
      testMatch: /playground\.spec\.ts/,
      use: {
        baseURL: webBaseURL,
      },
    },
    {
      name: 'hmr',
      testMatch: /hmr\.spec\.ts/,
      use: {
        baseURL: webBaseURL,
      },
    },
    {
      name: 'cli',
      testMatch: /cli\.spec\.ts/,
    },
    {
      name: 'adapters',
      testMatch: /adapters\.spec\.ts/,
    },
    {
      name: 'worker',
      testMatch: /worker\.spec\.ts/,
    },
  ],
  globalSetup: './tests/e2e/global-setup.ts',
})
