import type { CnOptions } from 'tailwind-variants'
import { cn as tvCn } from 'tailwind-variants'

/**
 * Merge class name inputs for Tailwind-friendly composition.
 *
 * @param inputs - Class name values.
 * @returns Combined class string.
 *
 * @example
 * import { cn } from '@mokup/playground'
 *
 * const className = cn('px-2', false && 'hidden')
 */
export function cn(...inputs: unknown[]) {
  return tvCn(...(inputs as CnOptions))
}
