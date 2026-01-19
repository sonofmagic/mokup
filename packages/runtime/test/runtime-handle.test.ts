import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createRuntime, parseRouteTemplate } from '../src/index'

async function createTempModule(source: string) {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-runtime-'))
  const handlerPath = path.join(root, 'handler.mjs')
  await fs.writeFile(handlerPath, source, 'utf8')
  return { root, moduleBase: new URL(`file://${root}/`) }
}

const handlerSource = [
  'export const rules = [',
  '  { response: { step: "first" } },',
  '  { response: { step: "second" } },',
  ']',
  '',
  'export const objectRule = {',
  '  response: { step: "object" },',
  '}',
  '',
  'export const bufferHandler = () => new Uint8Array([1, 2, 3]).buffer',
  '',
  'export default function handler(c) {',
  '  c.status(201)',
  '  c.header("x-rule", "handler")',
  '  c.header("x-temp", "remove")',
  '  c.res.headers.delete("x-temp")',
  '  return {',
  '    ok: true,',
  '    params: c.req.param(),',
  '    query: c.req.query(),',
  '  }',
  '}',
  '',
].join('\n')

function createRequest(pathname: string, method = 'GET') {
  return {
    method,
    path: pathname,
    query: { foo: 'bar' },
    headers: {},
    body: undefined,
  }
}

describe('runtime handling', () => {
  it('serves json, text, binary, and empty bodies', async () => {
    const runtime = createRuntime({
      manifest: {
        version: 1,
        routes: [
          {
            method: 'GET',
            url: '/json',
            response: { type: 'json', body: { ok: true } },
          },
          {
            method: 'GET',
            url: '/text',
            response: { type: 'text', body: 'hello' },
          },
          {
            method: 'GET',
            url: '/binary',
            response: {
              type: 'binary',
              body: Buffer.from('hello').toString('base64'),
              encoding: 'base64',
            },
          },
          {
            method: 'GET',
            url: '/empty',
            response: { type: 'json', body: undefined },
          },
        ],
      },
    })

    const jsonResult = await runtime.handle(createRequest('/json?foo=1#hash'))
    const jsonBody = jsonResult?.body ? JSON.parse(String(jsonResult.body)) : null
    expect(jsonResult?.status).toBe(200)
    expect(jsonResult?.headers['content-type']).toBe('application/json; charset=utf-8')
    expect(jsonBody).toEqual({ ok: true })

    const textResult = await runtime.handle(createRequest('/text'))
    expect(textResult?.body).toBe('hello')
    expect(textResult?.headers['content-type']).toBe('text/plain; charset=utf-8')

    const binaryResult = await runtime.handle(createRequest('/binary'))
    expect(binaryResult?.headers['content-type']).toBe('application/octet-stream')
    expect(binaryResult?.body).toBeInstanceOf(Uint8Array)
    expect(Array.from(binaryResult?.body ?? [])).toEqual([104, 101, 108, 108, 111])

    const emptyResult = await runtime.handle(createRequest('/empty'))
    expect(emptyResult?.status).toBe(204)
    expect(emptyResult?.body).toBeNull()
  })

  it('executes module handlers and resolves exportName/ruleIndex', async () => {
    const { moduleBase } = await createTempModule(handlerSource)
    const runtime = createRuntime({
      manifest: {
        version: 1,
        routes: [
          {
            method: 'GET',
            url: '/module/[id]',
            headers: { 'content-type': 'application/custom' },
            response: {
              type: 'module',
              module: './handler.mjs',
            },
          },
          {
            method: 'GET',
            url: '/module/object',
            response: {
              type: 'module',
              module: './handler.mjs',
              exportName: 'objectRule',
            },
          },
          {
            method: 'GET',
            url: '/module/rules',
            response: {
              type: 'module',
              module: './handler.mjs',
              exportName: 'rules',
              ruleIndex: 1,
            },
          },
          {
            method: 'GET',
            url: '/module/buffer',
            response: {
              type: 'module',
              module: './handler.mjs',
              exportName: 'bufferHandler',
            },
          },
        ],
      },
      moduleBase,
    })

    const defaultResult = await runtime.handle(createRequest('/module/42'))
    const defaultBody = defaultResult?.body ? JSON.parse(String(defaultResult.body)) : null
    expect(defaultResult?.status).toBe(201)
    expect(defaultResult?.headers['content-type']).toBe('application/custom')
    expect(defaultResult?.headers['x-rule']).toBe('handler')
    expect(defaultResult?.headers['x-temp']).toBeUndefined()
    expect(defaultBody).toEqual({
      ok: true,
      params: { id: '42' },
      query: { foo: 'bar' },
    })

    const objectResult = await runtime.handle(createRequest('/module/object'))
    const objectBody = objectResult?.body ? JSON.parse(String(objectResult.body)) : null
    expect(objectBody).toEqual({ step: 'object' })
    expect(objectResult?.headers['content-type']).toBe('application/json; charset=utf-8')

    const rulesResult = await runtime.handle(createRequest('/module/rules'))
    const rulesBody = rulesResult?.body ? JSON.parse(String(rulesResult.body)) : null
    expect(rulesBody).toEqual({ step: 'second' })

    const bufferResult = await runtime.handle(createRequest('/module/buffer'))
    expect(bufferResult?.headers['content-type']).toBe('application/octet-stream')
    expect(Array.from(bufferResult?.body ?? [])).toEqual([1, 2, 3])
  })

  it('skips invalid routes and falls back to GET', async () => {
    const runtime = createRuntime({
      manifest: {
        version: 1,
        routes: [
          {
            method: 'GET',
            url: '/(admin)/users',
            response: { type: 'json', body: { skip: true } },
          },
          {
            method: 'GET',
            url: '/fallback',
            response: { type: 'text', body: 'ok' },
          },
        ],
      },
    })

    const fallback = await runtime.handle(createRequest('/fallback', 'UNKNOWN'))
    expect(fallback?.body).toBe('ok')

    const skipped = await runtime.handle(createRequest('/(admin)/users'))
    expect(skipped).toBeNull()
  })

  it('throws when moduleBase is missing for relative modules', async () => {
    const runtime = createRuntime({
      manifest: {
        version: 1,
        routes: [
          {
            method: 'GET',
            url: '/module',
            response: { type: 'module', module: './handler.mjs' },
          },
        ],
      },
    })

    await expect(runtime.handle(createRequest('/module'))).rejects.toThrow(
      'moduleBase is required',
    )
  })

  it('accepts precomputed route tokens', async () => {
    const parsed = parseRouteTemplate('/tokens/[id]')
    const runtime = createRuntime({
      manifest: {
        version: 1,
        routes: [
          {
            method: 'GET',
            url: parsed.template,
            tokens: parsed.tokens,
            response: { type: 'json', body: { ok: true } },
          },
        ],
      },
    })

    const result = await runtime.handle(createRequest('/tokens/123'))
    const body = result?.body ? JSON.parse(String(result.body)) : null
    expect(body).toEqual({ ok: true })
  })
})
