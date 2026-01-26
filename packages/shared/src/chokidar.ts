/**
 * Re-export the default chokidar watcher factory.
 *
 * @example
 * import chokidar from '@mokup/shared/chokidar'
 *
 * const watcher = chokidar.watch(['mock'], { ignoreInitial: true })
 * watcher.on('add', (file) => console.log('added', file))
 */
export { default } from 'chokidar'
/**
 * Re-export chokidar types.
 *
 * @example
 * import type { FSWatcher } from '@mokup/shared/chokidar'
 */
export type * from 'chokidar'
