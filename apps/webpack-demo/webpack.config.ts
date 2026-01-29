import type { Configuration } from 'webpack'
// Pull in webpack-dev-server's type augmentation for Configuration.devServer.
import type {} from 'webpack-dev-server'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { mokupWebpack } from 'mokup/webpack'
import { VueLoaderPlugin } from 'vue-loader'
import { DefinePlugin } from 'webpack'
import { getMokupWebpackAliases } from '../../scripts/mokup-alias.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function config(_env: unknown, argv: { mode?: string }): Configuration {
  const isDev = argv.mode !== 'production'
  const withMokup = mokupWebpack({
    entries: {
      dir: 'mock',
      prefix: '/api',
    },
  })

  const base: Configuration = {
    mode: isDev ? 'development' : 'production',
    entry: path.resolve(__dirname, 'src/main.ts'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev ? 'assets/[name].js' : 'assets/[name].[contenthash].js',
      publicPath: '/',
      clean: true,
    },
    devtool: isDev ? 'cheap-module-source-map' : false,
    resolve: {
      extensions: ['.ts', '.js', '.vue', '.json'],
      alias: {
        ...getMokupWebpackAliases(),
        vue$: 'vue/dist/vue.esm-bundler.js',
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: {
            appendTsSuffixTo: [/\.vue$/],
            transpileOnly: true,
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: false,
      }),
      new VueLoaderPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
      }),
    ],
    devServer: {
      port: 8080,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.resolve(__dirname, 'public'),
      },
    },
  }

  return withMokup(base)
}

export default config
