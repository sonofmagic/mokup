import type { Manifest } from '@mokup/runtime'

import { promises as fs } from 'node:fs'

import { join } from '@mokup/shared/pathe'

export async function writeBundle(outDir: string, hasHandlers: boolean) {
  const lines = [
    'import manifest from \'./mokup.manifest.mjs\'',
  ]
  if (hasHandlers) {
    lines.push(
      'import { mokupModuleMap } from \'./mokup-handlers/index.mjs\'',
      '',
      'const mokupBundle = {',
      '  manifest,',
      '  moduleMap: mokupModuleMap,',
      '  moduleBase: \'./\',',
      '}',
    )
  }
  else {
    lines.push(
      '',
      'const mokupBundle = {',
      '  manifest,',
      '}',
    )
  }
  lines.push('', 'export default mokupBundle', 'export { mokupBundle }', '')

  const dts = [
    'import type { Manifest, ModuleMap } from \'@mokup/runtime\'',
    'export interface MokupBundle {',
    '  manifest: Manifest',
    '  moduleMap?: ModuleMap',
    '  moduleBase?: string | URL',
    '}',
    'declare const mokupBundle: MokupBundle',
    'export default mokupBundle',
    'export { mokupBundle }',
    '',
  ]

  await fs.writeFile(join(outDir, 'mokup.bundle.mjs'), lines.join('\n'), 'utf8')
  await fs.writeFile(join(outDir, 'mokup.bundle.d.ts'), dts.join('\n'), 'utf8')
  await fs.writeFile(join(outDir, 'mokup.bundle.d.mts'), dts.join('\n'), 'utf8')
}

export async function writeManifestModule(outDir: string, manifest: Manifest) {
  const lines = [
    `const manifest = ${JSON.stringify(manifest, null, 2)}`,
    '',
    'export default manifest',
    '',
  ]
  const dts = [
    'import type { Manifest } from \'@mokup/runtime\'',
    'declare const manifest: Manifest',
    'export default manifest',
    '',
  ]
  await fs.writeFile(join(outDir, 'mokup.manifest.mjs'), lines.join('\n'), 'utf8')
  await fs.writeFile(join(outDir, 'mokup.manifest.d.mts'), dts.join('\n'), 'utf8')
}
