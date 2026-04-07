import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import process from 'node:process'
import { repoRoot } from './paths'

interface CommandOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
}

function waitForChildProcess(child: ChildProcess) {
  return new Promise<void>((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Command failed with code ${String(code)} and signal ${String(signal)}`))
    })
  })
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
  await waitForChildProcess(spawn(command, args, {
    stdio: 'inherit',
    ...(typeof options.cwd === 'string' ? { cwd: options.cwd } : {}),
    ...(env ? { env } : {}),
  }))
}

const mokupCliPath = join(repoRoot, 'packages/mokup/dist/cli-bin.mjs')

export async function runMokup(
  args: string[],
  options: CommandOptions = {},
) {
  await runCommand(process.execPath, [mokupCliPath, ...args], options)
}
