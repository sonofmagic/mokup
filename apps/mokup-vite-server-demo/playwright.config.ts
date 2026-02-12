import { createPlaywrightConfig } from '../../tests/e2e/playwright.base'

export default createPlaywrightConfig({
  testDir: './test/e2e',
  overrides: {
    fullyParallel: false,
    workers: 1,
  },
})
