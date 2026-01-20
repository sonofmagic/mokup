#!/usr/bin/env node
import process from 'node:process'
import { runCli } from './cli'

runCli().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
