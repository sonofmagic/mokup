/**
 * Re-export the esbuild API used internally by mokup.
 *
 * @example
 * import { build } from '@mokup/shared/esbuild'
 *
 * await build({
 *   entryPoints: ['src/index.ts'],
 *   outfile: 'dist/index.js',
 *   bundle: true,
 *   platform: 'node',
 * })
 */
export * from 'esbuild'
