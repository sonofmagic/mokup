import type { BuildOptions } from './types'

import {
  collectFiles,
  isConfigFile,
  isSupportedFile,
} from '@mokup/shared/mock-files'
import { normalizeIgnorePrefix, resolveDirs as resolveDirsShared } from '@mokup/shared/scan-utils'

export { collectFiles, isConfigFile, isSupportedFile }
export { hasIgnoredPrefix, matchesFilter } from '@mokup/shared/path-utils'
export { normalizeIgnorePrefix }

export function resolveDirs(dir: BuildOptions['dir'], root: string) {
  return resolveDirsShared(dir, root)
}
