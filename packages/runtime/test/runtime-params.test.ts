import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  createRuntime,
  parseRouteTemplate,
} from '../src/index'

async function createTempModule() {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-runtime-'))
  const handlerPath = path.join(root, 'handler.mjs')
  const handlerSource = [
    'export default function handler(req) {',
    '  return {',
    '    ok: true,',
    '    id: req.params?.id ?? null,',
    '    slug: req.params?.slug ?? null,',
    '  }',
    '}',
    '',
  ].join('\n')
  await fs.writeFile(handlerPath, handlerSource, 'utf8')
  return { root }
}

describe('runtime params injection', () => {
  it('passes params to module handlers', async () => {
    const { root } = await createTempModule()
    const parsed = parseRouteTemplate('/users/[id]')
    const runtime = createRuntime({
      manifest: {
        version: 1,
        routes: [
          {
            method: 'GET',
            url: parsed.template,
            tokens: parsed.tokens,
            score: parsed.score,
            response: {
              type: 'module',
              module: './handler.mjs',
            },
          },
        ],
      },
      moduleBase: new URL(`file://${root}/`),
    })

    const result = await runtime.handle({
      method: 'GET',
      path: '/users/99',
      query: {},
      headers: {},
      body: undefined,
    })

    expect(result).not.toBeNull()
    const body = result?.body ? JSON.parse(String(result.body)) : null
    expect(body).toEqual({ ok: true, id: '99', slug: null })
  })
})
