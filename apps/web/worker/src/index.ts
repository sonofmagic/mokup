import { createMokupWorker } from '@mokup/server/worker'
import mokupBundle from './.mokup/mokup.bundle.mjs'

export default createMokupWorker(mokupBundle)
