/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

declare module 'virtual:mokup-bundle' {
  const mokupBundle: {
    manifest: import('mokup/runtime').Manifest
    moduleMap?: import('mokup/runtime').ModuleMap | undefined
    moduleBase?: string | URL | undefined
  }
  export default mokupBundle
  export { mokupBundle }
}

declare module 'hono' {
  interface ContextVariableMap {
    db: import('drizzle-orm/d1').DrizzleD1Database<typeof import('./db/schema')>
    auth: ReturnType<typeof import('better-auth').betterAuth>
  }
}
