import type { BodyReadableStream } from '@mokup/shared/stream-body'
import type { IncomingMessage } from 'node:http'
import { PassThrough } from 'node:stream'
import { readStreamBody } from '@mokup/shared/stream-body'
import { expectAssignable, expectType } from 'tsd'

declare const request: IncomingMessage
const minimalStream = { on: (_event: string, _listener: (...args: unknown[]) => void) => {} }

expectAssignable<BodyReadableStream>(request)
expectAssignable<BodyReadableStream>(new PassThrough())
expectAssignable<BodyReadableStream>(minimalStream)
expectType<Promise<Uint8Array | null>>(readStreamBody(minimalStream))
