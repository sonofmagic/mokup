import type {
  MokupPluginOptions,
  RequestHandler,
  RouteDirectoryConfig,
  RouteRule,
  VitePluginOptionsInput,
} from 'mokup'
import type { VitePluginOptions } from 'mokup/vite'
import type {
  WebpackConfig,
  WebpackPluginOptionsInput,
} from 'mokup/webpack'
import { defineConfig, defineHandler } from 'mokup'
import mokup from 'mokup/vite'
import { createMokupWebpackPlugin, mokupWebpack } from 'mokup/webpack'
import { expectAssignable, expectType } from 'tsd'

const options: MokupPluginOptions = {
  entries: { dir: 'mock' },
  playground: true,
}
const viteOptionsInput: VitePluginOptionsInput = options
const viteEntry: VitePluginOptions = { dir: 'mock', mode: 'server' }

expectType<MokupPluginOptions>(options)
expectType<VitePluginOptionsInput>(viteOptionsInput)
expectType<VitePluginOptions>(viteEntry)

const handler = defineHandler(c => ({ ok: true, method: c.req.method }))
expectAssignable<RequestHandler>(handler)

const rule = defineHandler({ handler: { ok: true }, status: 201 })
expectAssignable<RouteRule>(rule)

const configResult = defineConfig({ headers: { 'x-mokup': 'yes' } })
expectAssignable<RouteDirectoryConfig | Promise<RouteDirectoryConfig>>(configResult)

const plugin = mokup(options)
expectType<ReturnType<typeof mokup>>(plugin)

const webpackOptions: WebpackPluginOptionsInput = { entries: { dir: 'mock' } }
const webpackPlugin = createMokupWebpackPlugin(webpackOptions)
expectType<ReturnType<typeof createMokupWebpackPlugin>>(webpackPlugin)

const withMokup = mokupWebpack(webpackOptions)
const webpackConfig: WebpackConfig = withMokup({} as WebpackConfig)
expectType<WebpackConfig>(webpackConfig)
