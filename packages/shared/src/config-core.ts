export const middlewareSymbol = Symbol.for('mokup.config.middlewares')

export function isPromise<T = unknown>(value: T | Promise<T>): value is Promise<T> {
  return !!value && typeof (value as Promise<T>).then === 'function'
}
