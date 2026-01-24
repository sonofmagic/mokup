import type { HttpMethod } from '../shared/types'

/**
 * Reasons a route file was skipped during scanning.
 *
 * @example
 * import type { RouteSkipReason } from 'mokup/vite'
 *
 * const reason: RouteSkipReason = 'disabled'
 */
export type RouteSkipReason
  = | 'disabled'
    | 'disabled-dir'
    | 'exclude'
    | 'ignore-prefix'
    | 'include'

/**
 * Reasons a file was ignored during scanning.
 *
 * @example
 * import type { RouteIgnoreReason } from 'mokup/vite'
 *
 * const reason: RouteIgnoreReason = 'unsupported'
 */
export type RouteIgnoreReason
  = | 'unsupported'
    | 'invalid-route'

/**
 * Directory config discovery metadata.
 *
 * @example
 * import type { RouteConfigInfo } from 'mokup/vite'
 *
 * const info: RouteConfigInfo = { file: 'mock/index.config.ts', enabled: true }
 */
export interface RouteConfigInfo {
  /** Config file path. */
  file: string
  /**
   * Whether this config enables routes.
   *
   * @default true
   */
  enabled: boolean
}

/**
 * Decision chain entry for explaining disabled/ignored routes.
 *
 * @example
 * import type { RouteDecisionStep } from 'mokup/vite'
 *
 * const step: RouteDecisionStep = { step: 'config.enabled', result: 'pass' }
 */
export interface RouteDecisionStep {
  /** Decision step identifier. */
  step: string
  /** Pass or fail outcome for the step. */
  result: 'pass' | 'fail'
  /** Optional source file for the decision (e.g. config path). */
  source?: string
  /** Optional detail about the step. */
  detail?: string
}

/**
 * Effective configuration snapshot for a route.
 *
 * @example
 * import type { RouteEffectiveConfig } from 'mokup/vite'
 *
 * const config: RouteEffectiveConfig = { status: 404 }
 */
export interface RouteEffectiveConfig {
  headers?: Record<string, string>
  status?: number
  delay?: number
  enabled?: boolean
  ignorePrefix?: string | string[]
  include?: string | string[]
  exclude?: string | string[]
}

/**
 * Metadata for a skipped route.
 *
 * @example
 * import type { RouteSkipInfo } from 'mokup/vite'
 *
 * const info: RouteSkipInfo = {
 *   file: 'mock/disabled.get.ts',
 *   reason: 'disabled',
 * }
 */
export interface RouteSkipInfo {
  /** Route file path. */
  file: string
  /** Skip reason. */
  reason: RouteSkipReason
  /** Derived method (when available). */
  method?: HttpMethod
  /** Derived URL template (when available). */
  url?: string
  /** Ordered config file chain (root to leaf). */
  configChain?: string[]
  /** Decision chain for why the route was skipped. */
  decisionChain?: RouteDecisionStep[]
  /** Effective config snapshot for the route. */
  effectiveConfig?: RouteEffectiveConfig
}

/**
 * Metadata for an ignored file.
 *
 * @example
 * import type { RouteIgnoreInfo } from 'mokup/vite'
 *
 * const info: RouteIgnoreInfo = { file: 'mock/notes.txt', reason: 'unsupported' }
 */
export interface RouteIgnoreInfo {
  /** Ignored file path. */
  file: string
  /** Ignore reason. */
  reason: RouteIgnoreReason
  /** Ordered config file chain (root to leaf). */
  configChain?: string[]
  /** Decision chain for why the file was ignored. */
  decisionChain?: RouteDecisionStep[]
  /** Effective config snapshot for the file. */
  effectiveConfig?: RouteEffectiveConfig
}
