import type { MiddlewareHandler, RouteDirectoryConfig } from '../shared/types'

import { createDefineConfig } from '@mokup/shared/define-config'

const shared = createDefineConfig<RouteDirectoryConfig, MiddlewareHandler>({
  logPrefix: '[mokup]',
})

export const defineConfig = shared.defineConfig
export const onBeforeAll = shared.onBeforeAll
export const onAfterAll = shared.onAfterAll
