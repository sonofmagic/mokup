import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '@mokup/core'
import type { Hono } from '@mokup/shared/hono'
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
}

export type { PluginState }
