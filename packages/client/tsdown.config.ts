import { createPackageConfig } from '../../scripts/tsdown-config.ts'

export default createPackageConfig({
  entries: [
    'src/index',
    'src/axios',
    'src/fetch',
  ],
})
