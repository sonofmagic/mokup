import type { Hono } from '@mokup/shared/hono'
import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '../../vite/scanner'
import type { RouteTable } from '../../vite/types'

interface PluginState {
  routes: RouteTable
  serverRoutes: RouteTable
  swRoutes: RouteTable
  disabledRoutes: RouteSkipInfo[]
  ignoredRoutes: RouteIgnoreInfo[]
  configFiles: RouteConfigInfo[]
  disabledConfigFiles: RouteConfigInfo[]
  app: Hono | null
}

export type { PluginState }
