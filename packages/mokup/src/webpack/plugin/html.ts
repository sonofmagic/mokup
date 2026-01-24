import type { WebpackCompilation } from './types'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

interface HtmlWebpackHooks {
  alterAssetTagGroups?: {
    tap: (
      name: string,
      handler: (data: { headTags: unknown[], bodyTags: unknown[], publicPath?: string }) => void,
    ) => void
  }
  alterAssetTags?: {
    tap: (
      name: string,
      handler: (data: { assetTags: { scripts: unknown[] }, publicPath?: string }) => void,
    ) => void
  }
}

function resolveHtmlWebpackPlugin() {
  try {
    const mod = require('html-webpack-plugin') as {
      default?: unknown
      getHooks?: unknown
    }
    const plugin = (mod.default ?? mod) as {
      getHooks: (compilation: WebpackCompilation) => HtmlWebpackHooks
    }
    return plugin
  }
  catch {
    return null
  }
}

export { resolveHtmlWebpackPlugin }
