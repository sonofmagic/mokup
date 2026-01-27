import { describe, expect, it } from 'vitest'
import { createDirResolver, createHtmlAssetResolver, createSwPathResolver } from '../src/vite/plugin/resolvers'

describe('vite plugin resolvers', () => {
  it('dedupes and resolves directory entries', () => {
    const resolver = createDirResolver(
      [
        { dir: 'mock' },
        { dir: ['mock', '/root/mock'] },
      ],
      () => '/root',
    )
    const dirs = resolver()
    expect(dirs).toContain('/root/mock')
    expect(dirs.filter(dir => dir === '/root/mock')).toHaveLength(1)
  })

  it('resolves sw paths and scopes', () => {
    const { resolveSwRequestPath, resolveSwRegisterScope } = createSwPathResolver(() => '/base/')
    expect(resolveSwRequestPath('/sw.js')).toBe('/base/sw.js')
    expect(resolveSwRegisterScope('/scope/')).toBe('/base/scope/')
  })

  it('resolves html asset paths', () => {
    const { resolveHtmlAssetPath, resolveAssetsFileName } = createHtmlAssetResolver(
      () => '.',
      () => 'assets',
    )
    expect(resolveHtmlAssetPath('/logo.svg')).toBe('logo.svg')
    expect(resolveAssetsFileName('logo.svg')).toBe('assets/logo.svg')
  })
})
