import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function resolveHtmlWebpackPlugin() {
  try {
    const mod = require('html-webpack-plugin') as {
      default?: unknown
      getHooks?: unknown
    }
    const plugin = (mod.default ?? mod) as {
      getHooks: (compilation: {
        alterAssetTagGroups?: {
          tap: (name: string, handler: (data: { headTags: unknown[], bodyTags: unknown[], publicPath?: string }) => void) => void
        }
        alterAssetTags?: {
          tap: (name: string, handler: (data: { assetTags: { scripts: unknown[] }, publicPath?: string }) => void) => void
        }
      }) => {
        alterAssetTagGroups?: {
          tap: (name: string, handler: (data: { headTags: unknown[], bodyTags: unknown[], publicPath?: string }) => void) => void
        }
        alterAssetTags?: {
          tap: (name: string, handler: (data: { assetTags: { scripts: unknown[] }, publicPath?: string }) => void) => void
        }
      }
    }
    return plugin
  }
  catch {
    return null
  }
}

export { resolveHtmlWebpackPlugin }
