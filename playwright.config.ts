import process from 'node:process'
import { defineConfig } from '@playwright/test'
import { MOCK_VITE_SERVER_BASE_URL, WEB_BASE_URL } from './tests/e2e/constants'

const isCI = Boolean(process.env.CI)
const webBaseURL = WEB_BASE_URL

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
      name: 'mock-vite-server',
      testMatch: /mock-vite-server\.spec\.ts/,
      use: {
        baseURL: MOCK_VITE_SERVER_BASE_URL,
      },
    },
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
