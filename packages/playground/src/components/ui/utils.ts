import type { CnOptions } from 'tailwind-variants'
import { cn as tvCn } from 'tailwind-variants'

export function cn(...inputs: unknown[]) {
  return tvCn(...(inputs as CnOptions))
}
