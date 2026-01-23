import { build as esbuild } from '@mokup/shared/esbuild'

async function bundleScript(params: {
  code: string
  root: string
  sourceName: string
}) {
  const result = await esbuild({
    stdin: {
      contents: params.code,
      resolveDir: params.root,
      sourcefile: params.sourceName,
      loader: 'js',
    },
    absWorkingDir: params.root,
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2020',
    write: false,
  })
  return result.outputFiles[0]?.text ?? ''
}

export { bundleScript }
