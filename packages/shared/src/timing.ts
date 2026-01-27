export function createDebouncer(delayMs: number, fn: () => void) {
  let timer: NodeJS.Timeout | null = null
  return () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn()
    }, delayMs)
  }
}

export function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}
