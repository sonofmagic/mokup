import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { once } from 'node:events'
import { createServer } from 'node:http'

export async function smokeClientRequests() {
  const { createFetchAdapter, createAxiosRequestInterceptor } = await import('@mokup/client')
  const server = createServer((request, response) => {
    void (async () => {
      const chunks = []
      for await (const chunk of request) {
        chunks.push(chunk)
      }
      if (request.url === '/redirect') {
        response.writeHead(307, { location: '/echo' }).end()
        return
      }
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify({
        method: request.method,
        url: request.url,
        contentType: request.headers['content-type'],
        marker: request.headers['x-mokup-mode'],
        body: Buffer.concat(chunks).toString('base64'),
      }))
    })().catch(error => response.destroy(error))
  })
  try {
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const address = server.address()
    assert.ok(address && typeof address === 'object')
    const origin = `http://127.0.0.1:${address.port}`
    const plain = createFetchAdapter({ resolverOptions: { markers: { header: true } } })
    const rewritten = createFetchAdapter({ resolverOptions: { realBase: origin, markers: { header: true } } })
    for (const [adapter, source] of [[plain, origin], [rewritten, 'http://unused.invalid']]) {
      const response = await adapter(new Request(`${source}/redirect`, {
        method: 'POST',
        body: 'request payload',
        keepalive: true,
        signal: AbortSignal.timeout(10_000),
      }), { body: null, method: undefined, signal: undefined })
      assert.equal(response.status, 200)
      const result = await response.json()
      assert.equal(result.method, 'POST')
      assert.equal(result.url, '/echo')
      assert.equal(result.marker, 'real')
      assert.equal(Buffer.from(result.body, 'base64').toString(), 'request payload')
    }
    const bytes = new Uint8Array([0, 255, 128, 1])
    const form = new FormData()
    form.set('name', 'mokup')
    form.set('file', new Blob([bytes]), 'payload.bin')
    const response = await rewritten(new Request('http://unused.invalid/echo', {
      method: 'POST',
      body: form,
      keepalive: true,
      signal: AbortSignal.timeout(10_000),
    }))
    const result = await response.json()
    const received = await new Response(Buffer.from(result.body, 'base64'), {
      headers: { 'content-type': result.contentType },
    }).formData()
    assert.equal(received.get('name'), 'mokup')
    assert.deepEqual(new Uint8Array(await received.get('file').arrayBuffer()), bytes)

    const interceptor = createAxiosRequestInterceptor()
    const config = await interceptor({ baseURL: `${origin}/api/v1`, url: '/users' })
    assert.equal(config.url, `${origin}/api/v1/users`)
    assert.equal(config.baseURL, '')
    const { createAxiosExecutor } = await import('@mokup/query')
    const axios = {
      defaults: { baseURL: `${origin}/api/v1` },
      request: async config => ({ data: config.url }),
    }
    const executor = createAxiosExecutor({ axios })
    assert.equal(await executor({ url: '/users' }), `${origin}/api/v1/users`)
    axios.defaults.baseURL = `${origin}/api/v2`
    assert.equal(await executor({ url: '/users' }), `${origin}/api/v2/users`)
  }
  finally {
    server.closeAllConnections()
    if (server.listening) {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
    }
  }
}
