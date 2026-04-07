import type { Hono } from '@mokup/shared/hono'
import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '../../internal/core'
import type { RouteTable } from '../../shared/types'

interface PluginState {
  routes: RouteTable
  serverRoutes: RouteTable
  swRoutes: RouteTable
  disabledRoutes: RouteSkipInfo[]
  ignoredRoutes: RouteIgnoreInfo[]
  configFiles: RouteConfigInfo[]
  disabledConfigFiles: RouteConfigInfo[]
  app: Hono | null
  lastSignature: string | null
  lastDiagnosticsSignature: string | null
  swModuleVersion?: number
}

export type { PluginState }
