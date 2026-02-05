export const middlewareSymbol = Symbol.for('mokup.config.middlewares')

export function isPromise<T = unknown>(value: T | Promise<T>): value is Promise<Awaited<T>> {
  return !!value && typeof (value as Promise<Awaited<T>>).then === 'function'
}
