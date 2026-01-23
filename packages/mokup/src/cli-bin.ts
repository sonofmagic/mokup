#!/usr/bin/env node
import process from 'node:process'
import { createLogger } from '@mokup/shared/logger'
import { runCli } from './cli'

const logger = createLogger()

runCli().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
