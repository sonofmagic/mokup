import { describe, expect, it } from 'vitest'
import { buildSwLifecycleInlineScript, buildSwLifecycleScript, resolveSwModuleImport } from '../src/vite/plugin/sw'

const baseResolvers = {
  resolveRequestPath: (path: string) => `/base${path}`,
  resolveRegisterScope: (scope: string) => `/base${scope}`,
}

describe('vite plugin sw helpers', () => {
  it('resolves module imports with fallbacks', async () => {
    const resolved = await resolveSwModuleImport({
      resolve: async (id: string) => (id === 'mokup/sw' ? { id: '/resolved/sw.mjs' } : null),
    })
    expect(resolved).toBe('/resolved/sw.mjs')

    const fallback = await resolveSwModuleImport({
      resolve: async (id: string) => (id === 'mokup/sw' ? null : { id: '/fallback/sw.mjs' }),
    })
    expect(fallback).toBe('/fallback/sw.mjs')

    const local = await resolveSwModuleImport({
      resolve: async () => null,
    })
    expect(local).toMatch(/sw\.(mjs|js|ts)$/)
  })

  it('builds unregister scripts when needed', () => {
    const script = buildSwLifecycleScript({
      importPath: 'mokup/sw',
      swConfig: null,
      unregisterConfig: { path: '/sw.js', scope: '/', register: true, unregister: true, basePaths: [] },
      hasSwEntries: false,
      hasSwRoutes: false,
      ...baseResolvers,
    })
    expect(script).toContain('unregisterMokupServiceWorker')

    const inline = buildSwLifecycleInlineScript({
      swConfig: null,
      unregisterConfig: { path: '/sw.js', scope: '/', register: true, unregister: true, basePaths: [] },
      hasSwEntries: false,
      hasSwRoutes: false,
      ...baseResolvers,
    })
    expect(inline).toContain('navigator.serviceWorker.getRegistrations')
  })

  it('builds registration scripts when enabled', () => {
    const script = buildSwLifecycleScript({
      importPath: 'mokup/sw',
      swConfig: { path: '/sw.js', scope: '/', register: true, unregister: false, basePaths: [] },
      unregisterConfig: { path: '/sw.js', scope: '/', register: true, unregister: false, basePaths: [] },
      hasSwEntries: true,
      hasSwRoutes: true,
      ...baseResolvers,
    })
    expect(script).toContain('registerMokupServiceWorker')

    const inline = buildSwLifecycleInlineScript({
      swConfig: { path: '/sw.js', scope: '/', register: true, unregister: false, basePaths: [] },
      unregisterConfig: { path: '/sw.js', scope: '/', register: true, unregister: false, basePaths: [] },
      hasSwEntries: true,
      hasSwRoutes: true,
      ...baseResolvers,
    })
    expect(inline).toContain('navigator.serviceWorker.register')
  })

  it('returns null when registration is disabled', () => {
    const script = buildSwLifecycleScript({
      importPath: 'mokup/sw',
      swConfig: { path: '/sw.js', scope: '/', register: false, unregister: false, basePaths: [] },
      unregisterConfig: { path: '/sw.js', scope: '/', register: true, unregister: false, basePaths: [] },
      hasSwEntries: true,
      hasSwRoutes: true,
      ...baseResolvers,
    })
    expect(script).toBeNull()

    const inline = buildSwLifecycleInlineScript({
      swConfig: { path: '/sw.js', scope: '/', register: false, unregister: false, basePaths: [] },
      unregisterConfig: { path: '/sw.js', scope: '/', register: true, unregister: false, basePaths: [] },
      hasSwEntries: true,
      hasSwRoutes: false,
      ...baseResolvers,
    })
    expect(inline).toBeNull()
  })
})
