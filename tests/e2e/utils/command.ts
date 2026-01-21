import type { Options } from 'execa'
import { join } from 'node:path'
import process from 'node:process'
import { execa } from 'execa'
import { repoRoot } from './paths'

interface CommandOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
}

export async function runCommand(
  command: string,
  args: string[],
  options: CommandOptions = {},
) {
  const env = options.env
    ? Object.fromEntries(
        Object.entries(options.env).filter((entry): entry is [string, string] => {
          return typeof entry[1] === 'string'
        }),
      )
    : undefined
  const execaOptions: Options = {
    stdio: 'inherit',
    ...(typeof options.cwd === 'string' ? { cwd: options.cwd } : {}),
    ...(env ? { env } : {}),
  }
  await execa(command, args, execaOptions)
}

const mokupCliPath = join(repoRoot, 'packages/mokup/dist/cli-bin.mjs')

export async function runMokup(
  args: string[],
  options: CommandOptions = {},
) {
  await runCommand(process.execPath, [mokupCliPath, ...args], options)
}
