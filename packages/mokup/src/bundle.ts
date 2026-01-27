/**
 * Cross-platform bundle module generator.
 *
 * @example
 * import { buildBundleModule } from 'mokup/bundle'
 *
 * const source = buildBundleModule({ routes: [], root: '/project' })
 */
export { buildBundleModule } from './core/bundle'

export type { ResolvedRoute, RouteTable } from './shared/types'
