export type { ResolvedRoute, RouteTable } from './shared/types'

/**
 * Cross-platform bundle module generator.
 *
 * @example
 * import { buildBundleModule } from 'mokup/bundle'
 *
 * const source = buildBundleModule({ routes: [], root: '/project' })
 */
export { buildBundleModule } from '@mokup/core'
