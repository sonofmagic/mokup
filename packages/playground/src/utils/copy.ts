import type { AuthType, BodyType, RawBodyType } from '../types'
import type { BuildCurlOptions } from './curl'
import { parseJsonInput } from './request'

interface ResolveCopyOptionsInput {
  method: string
  url: string
  headersText: string
  bodyType: BodyType
  rawType: RawBodyType
  bodyText: string
  authType: AuthType
  authToken: string
  authUsername: string
  authPassword: string
  authKeyName: string
  authKeyValue: string
  authKeyLocation: 'header' | 'query'
  authCustomName: string
  authCustomValue: string
}

function resolveCopyOptions(input: ResolveCopyOptionsInput): BuildCurlOptions {
  const parsedHeaders = parseJsonInput(input.headersText)
  const headers: Record<string, string> = {}
  if (parsedHeaders.value && typeof parsedHeaders.value === 'object') {
    for (const [k, v] of Object.entries(parsedHeaders.value)) {
      headers[k] = String(v)
    }
  }

  return {
    method: input.method,
    url: input.url,
    headers,
    bodyType: input.bodyType,
    rawType: input.rawType,
    bodyText: input.bodyText,
    authType: input.authType,
    authToken: input.authToken,
    authUsername: input.authUsername,
    authPassword: input.authPassword,
    authKeyName: input.authKeyName,
    authKeyValue: input.authKeyValue,
    authKeyLocation: input.authKeyLocation,
    authCustomName: input.authCustomName,
    authCustomValue: input.authCustomValue,
  }
}

export { resolveCopyOptions }
export type { ResolveCopyOptionsInput }
