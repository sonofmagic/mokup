/**
 * Re-export the jsonc-parser API for parsing JSON with comments.
 *
 * @example
 * import { parse } from '@mokup/shared/jsonc-parser'
 *
 * const value = parse('{\n // comment\n "ok": true\n}')
 */
export * from 'jsonc-parser'
