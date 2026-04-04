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
 * Ordered list of all supported diagnostic categories.
 *
 * @example
 * import { diagnosticCategories } from '@mokup/shared'
 *
 * diagnosticCategories.includes('invalid-route')
 */
export const diagnosticCategories = [
  'invalid-route',
  'unsupported-fields',
  'missing-handler',
  'duplicate-route',
  'sw-conflict',
] as const satisfies readonly DiagnosticCategory[]

/**
 * Runtime guard for supported diagnostic categories.
 *
 * @example
 * import { isDiagnosticCategory } from '@mokup/shared'
 *
 * isDiagnosticCategory('invalid-route')
 */
export function isDiagnosticCategory(value: string): value is DiagnosticCategory {
  return diagnosticCategories.includes(value as DiagnosticCategory)
}

/**
 * Controls which diagnostics should fail instead of warn.
 *
 * @example
 * import type { DiagnosticErrorMode } from '@mokup/shared'
 *
 * const errorOn: DiagnosticErrorMode = ['invalid-route']
 */
export type DiagnosticErrorMode = 'all' | DiagnosticCategory[]
