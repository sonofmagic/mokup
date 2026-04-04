import { describe, expect, it } from 'vitest'
import { evaluateMigrationGuards } from '../../../scripts/check-migration-guards.mjs'

describe('migration guards', () => {
  it('accepts rolldown and tsdown aligned package metadata', () => {
    const violations = evaluateMigrationGuards({
      packageEntries: [
        {
          file: 'packages/example/package.json',
          pkg: {
            name: '@mokup/example',
            type: 'module',
            private: false,
            engines: {
              node: '^20.19.0 || >=22.12.0',
            },
            scripts: {
              build: 'tsdown',
              dev: 'tsdown --watch',
            },
            exports: {
              '.': {
                types: './dist/index.d.ts',
                import: './dist/index.mjs',
                default: './dist/index.mjs',
              },
            },
          },
        },
      ],
      rootPackage: {
        engines: {
          node: '^20.19.0 || >=22.12.0',
        },
        pnpm: {
          overrides: {
            rolldown: '1.0.0-rc.13',
          },
        },
      },
      scanEntries: [
        {
          file: 'packages/example/src/index.ts',
          content: `import { build } from '@mokup/shared/rolldown'\nexport { build }\n`,
        },
        {
          file: 'apps/mokup-docs/docs/reference/webpack-plugin.md',
          content: `import { mokupWebpack } from 'mokup/webpack'\nexport default mokupWebpack({})\n`,
        },
      ],
    })

    expect(violations).toEqual([])
  })

  it('reports legacy build-chain regressions', () => {
    const violations = evaluateMigrationGuards({
      packageEntries: [
        {
          file: 'packages/example/package.json',
          pkg: {
            name: '@mokup/example',
            type: 'commonjs',
            private: false,
            engines: {
              node: '>=20',
            },
            scripts: {
              build: 'tsup',
              dev: 'vite',
            },
            exports: {
              '.': {
                require: './dist/index.cjs',
                default: './dist/index.cjs',
              },
            },
            dependencies: {
              esbuild: '^0.27.0',
            },
          },
        },
      ],
      rootPackage: {
        engines: {
          node: '>=20',
        },
        pnpm: {
          overrides: {
            rolldown: '1.0.0-beta.1',
          },
        },
      },
      scanEntries: [
        {
          file: 'packages/example/src/index.ts',
          content: `import { build } from '@mokup/shared/esbuild'\nimport { transform } from 'esbuild'\n`,
        },
        {
          file: 'packages/example/tsup.config.ts',
          content: 'export default {}',
        },
        {
          file: 'apps/mokup-docs/docs/reference/webpack-plugin.md',
          content: `const { mokupWebpack } = require('mokup/webpack')\nmodule.exports = mokupWebpack({})\n`,
        },
      ],
    })

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('@mokup/shared/esbuild'),
        expect.stringContaining('Direct esbuild imports'),
        expect.stringContaining('Legacy tsup/unbuild'),
        expect.stringContaining('type must be "module"'),
        expect.stringContaining('build script must be "tsdown"'),
        expect.stringContaining('dev script must use "tsdown --watch"'),
        expect.stringContaining('must not depend on esbuild'),
        expect.stringContaining('must not expose a require export condition'),
        expect.stringContaining('must stay ESM-only'),
        expect.stringContaining('public docs must use ESM import examples'),
        expect.stringContaining('public docs must use ESM config examples'),
        expect.stringContaining('root engines.node'),
        expect.stringContaining('pnpm.overrides.rolldown'),
      ]),
    )
  })
})
