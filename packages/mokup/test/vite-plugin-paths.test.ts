import { describe, expect, it } from 'vitest'
import {
  formatPlaygroundUrl,
  normalizeBase,
  resolveRegisterPath,
  resolveRegisterScope,
  resolveSwImportPath,
  resolveSwLoggerImportPath,
  resolveSwRuntimeImportPath,
} from '../src/vite/plugin/paths'

describe('vite plugin paths', () => {
  it('normalizes base paths', () => {
    expect(normalizeBase('')).toBe('/')
    expect(normalizeBase('.')).toBe('/')
    expect(normalizeBase('api')).toBe('/api/')
    expect(normalizeBase('/api')).toBe('/api/')
  })

  it('resolves register paths and scopes', () => {
    expect(resolveRegisterPath('/base/', '/sw.js')).toBe('/base/sw.js')
    expect(resolveRegisterPath('/base/', 'sw.js')).toBe('/base/sw.js')
    expect(resolveRegisterScope('/base/', '/scope/')).toBe('/base/scope/')
  })

  it('formats playground URLs', () => {
    expect(formatPlaygroundUrl('http://localhost:5173/', '/__mokup')).toBe('http://localhost:5173/__mokup')
    expect(formatPlaygroundUrl(undefined, '/__mokup')).toBe('/__mokup')
  })

  it('resolves sw import paths', () => {
    expect(resolveSwImportPath('/base/')).toBe('/base/@id/mokup/sw')
    expect(resolveSwRuntimeImportPath('/base/')).toBe('/base/@id/mokup/runtime')
    expect(resolveSwLoggerImportPath('/base/')).toBe('/base/@id/@mokup/shared/logger')
  })
})
