export {
  parseBody,
  toArrayBuffer,
  toBinaryBody,
} from './internal/body'
export {
  normalizeHeaders,
  normalizeNodeHeaders,
  normalizeQuery,
  resolveUrl,
} from './internal/normalize'
export {
  toRuntimeRequestFromFetch,
  toRuntimeRequestFromNode,
} from './internal/request'
export {
  applyRuntimeResultToNode,
  toRuntimeOptions,
} from './internal/runtime'
export type { NodeRequestLike, NodeResponseLike, ReadableStreamLike } from './internal/types'
