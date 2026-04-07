import type {
  RouteConfigInfo,
  RouteIgnoreInfo,
  RouteSkipInfo,
} from '@mokup/core'
import type { Logger, RouteTable } from './types'

import { scanRoutes as scanRoutesCore } from '@mokup/core'

export type {
  RouteConfigInfo,
  RouteDecisionStep,
  RouteEffectiveConfig,
  RouteIgnoreInfo,
  RouteIgnoreReason,
  RouteSkipInfo,
  RouteSkipReason,
} from '@mokup/core'

/**
 * Scan directories for mock routes and build the route table.
 *
 * This is a compatibility wrapper around `@mokup/core`.
 */
export async function scanRoutes(params: {
  dirs: string[]
  prefix: string
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
  ignorePrefix?: string | string[]
  logger: Logger
  onSkip?: (info: RouteSkipInfo) => void
  onIgnore?: (info: RouteIgnoreInfo) => void
  onConfig?: (info: RouteConfigInfo) => void
}): Promise<RouteTable> {
  return await scanRoutesCore(params) as RouteTable
}
