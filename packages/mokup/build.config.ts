import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  clean: true,
  declaration: true,
  entries: [
    'src/cli-bin',
    'src/cli',
    'src/bundle',
    'src/index',
    'src/runtime',
    'src/server',
    'src/server/fetch',
    'src/server/node',
    'src/server/worker',
    'src/vite',
    'src/webpack',
    'src/sw',
    {
      input: 'src/types',
      outDir: 'dist/types',
      builder: 'copy',
      pattern: '**/*.d.ts',
    },
  ],
  rollup: {
    emitCJS: true,
  },
  hooks: {
    'build:done': async function () {
      const distRoot = resolve('dist')
      const updates = [
        {
          file: resolve(distRoot, 'index.d.ts'),
          ref: '/// <reference path="./types/virtual.d.ts" />',
        },
        {
          file: resolve(distRoot, 'vite.d.ts'),
          ref: '/// <reference path="./types/virtual.d.ts" />',
        },
        {
          file: resolve(distRoot, 'server/worker.d.ts'),
          ref: '/// <reference path="../types/virtual.d.ts" />',
        },
      ]

      await Promise.all(updates.map(async ({ file, ref }) => {
        try {
          const contents = await readFile(file, 'utf8')
          if (contents.includes(ref)) {
            return
          }

          await writeFile(file, `${ref}\n\n${contents}`, 'utf8')
        }
        catch {
          // Skip missing outputs in stub mode or when entries change.
        }
      }))
    },
  },
})
