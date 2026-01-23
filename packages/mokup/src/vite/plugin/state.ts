import type { Hono } from '@mokup/shared/hono'
import type { RouteConfigInfo, RouteIgnoreInfo, RouteSkipInfo } from '../scanner'
import type { RouteTable } from '../types'

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
}

export type { PluginState }
