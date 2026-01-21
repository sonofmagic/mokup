import { execa } from 'execa'

interface CommandOptions {
  cwd?: string
  env?: NodeJS.ProcessEnv
}

export async function runCommand(
  command: string,
  args: string[],
  options: CommandOptions = {},
) {
  await execa(command, args, {
    stdio: 'inherit',
    cwd: options.cwd,
    env: options.env,
  })
}
