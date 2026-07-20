import process from 'node:process'
import { defineConfig } from 'vitest/config'

const execArgv = process.allowedNodeEnvironmentFlags.has('--no-experimental-webstorage')
  ? ['--no-experimental-webstorage']
  : []

export default defineConfig({
  test: {
    execArgv,
    include: ['test/**/*.test.ts'],
    environment: 'jsdom',
  },
})
