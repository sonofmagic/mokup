import type { RouteDirectoryConfig } from 'mokup'

const config: RouteDirectoryConfig = {
  enabled: false,
  headers: {
    'x-mokup-disabled-dir': 'true',
  },
}

export default config
