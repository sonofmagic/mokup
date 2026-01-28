import type { HttpMethod } from './types'

import {
  configExtensions as sharedConfigExtensions,
  methodSet as sharedMethodSet,
  methodSuffixSet as sharedMethodSuffixSet,
  supportedExtensions as sharedSupportedExtensions,
} from '@mokup/shared/route-constants'

export const methodSet = sharedMethodSet as Set<HttpMethod>
export const methodSuffixSet = sharedMethodSuffixSet
export const supportedExtensions = sharedSupportedExtensions
export const configExtensions = sharedConfigExtensions
