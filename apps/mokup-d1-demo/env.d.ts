/// <reference types="vite/client" />

import type { betterAuth } from 'better-auth'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import type * as schema from './db/schema'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

declare module 'hono' {
  interface ContextVariableMap {
    db: DrizzleD1Database<typeof schema>
    auth: ReturnType<typeof betterAuth>
  }
}
