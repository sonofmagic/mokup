import type { AxiosRequestConfig } from 'axios'

import { apiClient } from './client'

export interface ApiResult {
  status: number
  statusText: string
  duration: number
  headers: Record<string, string>
  data: unknown
  ok: boolean
  note?: string
}

export interface RequestOptions {
  method: AxiosRequestConfig['method']
  url: string
  params?: Record<string, unknown>
  data?: unknown
  headers?: Record<string, string>
  responseType?: AxiosRequestConfig['responseType']
}

function normalizeHeaders(headers: Record<string, unknown>) {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === 'string') {
      normalized[key] = value
    }
    else if (Array.isArray(value)) {
      normalized[key] = value.join(', ')
    }
    else if (typeof value === 'number') {
      normalized[key] = String(value)
    }
  }
  return normalized
}

function normalizeResponseData(
  data: unknown,
  responseType: AxiosRequestConfig['responseType'],
) {
  if (responseType === 'arraybuffer' && data instanceof ArrayBuffer) {
    const bytes = new Uint8Array(data)
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    const base64 = btoa(binary)
    return {
      data: base64,
      note: `ArrayBuffer ${bytes.length} bytes (base64)`,
    }
  }
  return { data }
}

export async function sendRequest(options: RequestOptions): Promise<ApiResult> {
  const startedAt = performance.now()
  const response = await apiClient.request({
    method: options.method,
    url: options.url,
    params: options.params,
    data: options.data,
    headers: options.headers,
    responseType: options.responseType,
  })
  const duration = Math.round(performance.now() - startedAt)
  const normalized = normalizeResponseData(response.data, options.responseType)
  return {
    status: response.status,
    statusText: response.statusText,
    duration,
    headers: normalizeHeaders(response.headers ?? {}),
    data: normalized.data,
    note: normalized.note,
    ok: response.status >= 200 && response.status < 300,
  }
}
