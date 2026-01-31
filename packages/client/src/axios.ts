import './axios-augment'

export {
  applyMokupToAxios,
  createAxiosRequestInterceptor,
} from './adapters/axios'
export type {
  AxiosAdapterOptions,
  AxiosInstanceLike,
  AxiosRequestConfig,
} from './adapters/axios'
