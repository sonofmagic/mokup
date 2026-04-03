import { build as rolldown } from '@mokup/shared/rolldown'

async function bundleScript(params: {
  code: string
  root: string
  sourceName: string
}) {
  const result = await rolldown({
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
