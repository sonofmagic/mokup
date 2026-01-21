import { Buffer } from 'node:buffer'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildResponse,
  getHandlerModulePath,
  writeHandlerIndex,
} from '../src/manifest/handlers'

describe('manifest handler helpers', () => {
  it('builds responses for handler types and records handler modules', () => {
    const root = '/tmp/mokup-handlers'
    const file = path.join(root, 'mock', 'handler.get.ts')
    const handlersDir = path.join(root, '.mokup', 'mokup-handlers')
    const handlerSources = new Set<string>()
    const handlerModuleMap = new Map<string, string>()

    const response = buildResponse(
      () => 'ok',
      {
        file,
        handlers: true,
        handlerSources,
        handlerModuleMap,
        handlersDir,
        root,
        ruleIndex: 2,
      },
    )

    const expectedModule = getHandlerModulePath(file, handlersDir, root)
    expect(response).toEqual({
      type: 'module',
      module: expectedModule,
      ruleIndex: 2,
    })
    expect(handlerSources.has(file)).toBe(true)
    expect(handlerModuleMap.get(file)).toBe(expectedModule)

    expect(buildResponse(
      () => 'skip',
      {
        file,
        handlers: false,
        handlerSources,
        handlerModuleMap,
        handlersDir,
        root,
        ruleIndex: 0,
      },
    )).toBeNull()

    expect(buildResponse(
      'hello',
      {
        file,
        handlers: true,
        handlerSources,
        handlerModuleMap,
        handlersDir,
        root,
        ruleIndex: 0,
      },
    )).toEqual({ type: 'text', body: 'hello' })

    const binary = buildResponse(
      new Uint8Array([1, 2, 3]),
      {
        file,
        handlers: true,
        handlerSources,
        handlerModuleMap,
        handlersDir,
        root,
        ruleIndex: 0,
      },
    )
    expect(binary?.type).toBe('binary')
    expect(binary).toMatchObject({
      body: Buffer.from([1, 2, 3]).toString('base64'),
      encoding: 'base64',
    })

    const bufferResponse = buildResponse(
      Buffer.from('ok'),
      {
        file,
        handlers: true,
        handlerSources,
        handlerModuleMap,
        handlersDir,
        root,
        ruleIndex: 0,
      },
    )
    expect(bufferResponse?.type).toBe('binary')

    const jsonResponse = buildResponse(
      { ok: true },
      {
        file,
        handlers: true,
        handlerSources,
        handlerModuleMap,
        handlersDir,
        root,
        ruleIndex: 0,
      },
    )
    expect(jsonResponse).toEqual({ type: 'json', body: { ok: true } })
  })

  it('writes handler index with unique module imports', async () => {
    const root = await fs.mkdtemp(path.join(tmpdir(), 'mokup-handlers-'))
    const outDir = path.join(root, 'dist')
    const handlersDir = path.join(outDir, 'mokup-handlers')
    const handlerModuleMap = new Map<string, string>()
    try {
      await fs.mkdir(handlersDir, { recursive: true })
      handlerModuleMap.set('/file/a', './mokup-handlers/mock/handler.mjs')
      handlerModuleMap.set('/file/b', './mokup-handlers/mock/handler.mjs')

      await writeHandlerIndex(handlerModuleMap, handlersDir, outDir)

      const indexContent = await fs.readFile(path.join(handlersDir, 'index.mjs'), 'utf8')
      expect(indexContent.match(/import \* as module/g)?.length).toBe(1)
      expect(indexContent).toContain('mokupModuleMap')

      const dts = await fs.readFile(path.join(handlersDir, 'index.d.ts'), 'utf8')
      expect(dts).toContain('ModuleMap')
    }
    finally {
      await fs.rm(root, { recursive: true, force: true })
    }
  })
})
