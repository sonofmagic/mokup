/**
 * Shared diagnostic categories emitted during mokup route scanning.
 *
 * @example
 * import type { DiagnosticCategory } from '@mokup/shared'
 *
 * const category: DiagnosticCategory = 'invalid-route'
 */
export type DiagnosticCategory
  = | 'invalid-route'
    | 'unsupported-fields'
    | 'missing-handler'
    | 'duplicate-route'
    | 'sw-conflict'

/**
 * Controls which diagnostics should fail instead of warn.
 *
 * @example
 * import type { DiagnosticErrorMode } from '@mokup/shared'
 *
 * const errorOn: DiagnosticErrorMode = ['invalid-route']
 */
export type DiagnosticErrorMode = 'all' | DiagnosticCategory[]
