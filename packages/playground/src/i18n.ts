import { createI18n } from 'vue-i18n'

/**
 * Supported playground locales.
 *
 * @example
 * import type { PlaygroundLocale } from '@mokup/playground'
 *
 * const locale: PlaygroundLocale = 'en-US'
 */
export type PlaygroundLocale = 'en-US' | 'zh-CN'

const LOCALE_KEY = 'mokup.playground.locale'

const messages = {
  'en-US': {
    header: {
      title: 'Mock Playground',
      subtitle:
        'Inspect mock endpoints, craft requests, and validate responses without leaving the dev server.',
      refresh: 'Refresh',
      routes: '{count} routes',
      calls: '{count} calls',
      languageToggle: 'Language',
      themeToggle: 'Theme',
    },
    controls: {
      more: 'More',
    },
    theme: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    filters: {
      search: 'Search',
      base: 'Base',
      searchPlaceholder: 'Filter by method, path, or file',
    },
    disabled: {
      active: 'Active ({count})',
      disabled: 'Disabled ({count})',
      ignored: 'Ignored ({count})',
      reason: {
        'disabled': 'Disabled',
        'disabled-dir': 'Disabled (dir)',
        'ignore-prefix': 'Ignore prefix',
        'include': 'Include filter',
        'exclude': 'Exclude filter',
        'unknown': 'Unknown',
      },
    },
    enabled: {
      api: 'API ({count})',
      config: 'Config ({count})',
      configLabel: 'Config',
    },
    ignored: {
      reason: {
        'unsupported': 'Unsupported',
        'invalid-route': 'Not a route',
        'unknown': 'Unknown',
      },
    },
    tabs: {
      overview: 'Overview',
    },
    tree: {
      file: 'File',
      route: 'Route',
    },
    states: {
      loadingRoutes: 'Loading routes...',
      emptyRoutes: 'No routes matched.',
      emptyDisabledRoutes: 'No disabled routes matched.',
      emptyIgnoredRoutes: 'No ignored files matched.',
      emptyDisabledConfigFiles: 'No disabled config files matched.',
      emptyConfigFiles: 'No config files matched.',
      disabledTitle: 'Disabled routes',
      disabledHint: 'Disabled routes are not executable.',
      ignoredTitle: 'Ignored files',
      ignoredHint: 'Ignored files are not mock routes.',
      configTitle: 'Config files',
      configHint: 'Config files are not mock routes.',
    },
    detail: {
      selectTitle: 'Select a route',
      selectHint: 'Choose a route on the left to run a request.',
      requestLabel: 'Request',
      responseLabel: 'Response',
      run: 'Run',
      params: 'Params',
      emptyParams: 'No params for this route.',
      query: 'Query (JSON)',
      headers: 'Headers (JSON)',
      body: 'Body',
      bodyType: 'Body type',
      bodyTypeJson: 'JSON',
      bodyTypeText: 'Text',
      bodyTypeForm: 'Form',
      bodyTypeMultipart: 'Multipart',
      bodyTypeBase64: 'Base64',
      middlewares: 'Middlewares',
      openInVscode: 'Open in VSCode',
      queryPlaceholder: '{json}',
      headersPlaceholder: '{json}',
      bodyPlaceholderJson: '{json}',
      bodyPlaceholderText: 'raw text',
      bodyPlaceholderForm: '{sample}',
      bodyPlaceholderMultipart: '{sample}',
      bodyPlaceholderBase64: '{sample}',
      paramPlaceholder: 'value',
      paramPlaceholderCatchall: 'path/segments',
    },
    response: {
      idle: 'Idle',
      empty: 'No response yet.',
      waiting: 'Waiting for response...',
      loading: 'Loading...',
      error: 'Error',
      emptyPayload: '[empty response]',
    },
    errors: {
      queryJson: 'Query JSON error: {message}',
      headersJson: 'Headers JSON error: {message}',
      bodyJson: 'Body JSON error: {message}',
      bodyBase64: 'Body base64 error: {message}',
      routeParams: 'Missing route params: {params}',
    },
  },
  'zh-CN': {
    header: {
      title: '接口调试台',
      subtitle: '查看 Mock 接口、构造请求并验证响应，无需离开开发服务器。',
      refresh: '刷新',
      routes: '{count} 条接口',
      calls: '已调用 {count} 次',
      languageToggle: '语言',
      themeToggle: '主题',
    },
    controls: {
      more: '更多',
    },
    theme: {
      system: '跟随系统',
      light: '亮色',
      dark: '暗色',
    },
    filters: {
      search: '搜索',
      base: '基路径',
      searchPlaceholder: '按方法、路径或文件过滤',
    },
    disabled: {
      active: '启用 ({count})',
      disabled: '禁用 ({count})',
      ignored: '忽略 ({count})',
      reason: {
        'disabled': '已禁用',
        'disabled-dir': '目录禁用',
        'ignore-prefix': '前缀忽略',
        'include': '未命中包含',
        'exclude': '命中排除',
        'unknown': '未知',
      },
    },
    enabled: {
      api: '接口 ({count})',
      config: '配置 ({count})',
      configLabel: '配置',
    },
    ignored: {
      reason: {
        'unsupported': '不支持的文件',
        'invalid-route': '非路由文件',
        'unknown': '未知',
      },
    },
    tabs: {
      overview: '总览',
    },
    tree: {
      file: '文件',
      route: '路由',
    },
    states: {
      loadingRoutes: '正在加载接口...',
      emptyRoutes: '没有匹配的接口。',
      emptyDisabledRoutes: '没有匹配的禁用接口。',
      emptyIgnoredRoutes: '没有匹配的忽略文件。',
      emptyDisabledConfigFiles: '没有匹配的禁用配置文件。',
      emptyConfigFiles: '没有匹配的配置文件。',
      disabledTitle: '禁用接口',
      disabledHint: '禁用接口无法调试。',
      ignoredTitle: '忽略的文件',
      ignoredHint: '忽略列表中的文件不属于接口。',
      configTitle: '配置文件',
      configHint: '配置文件不属于接口。',
    },
    detail: {
      selectTitle: '请选择接口',
      selectHint: '从左侧选择一个接口开始调试。',
      requestLabel: '请求',
      responseLabel: '响应',
      run: '发送',
      params: '路径参数',
      emptyParams: '该接口没有路径参数。',
      query: '查询参数 (JSON)',
      headers: '请求头 (JSON)',
      body: '请求体',
      bodyType: '请求体类型',
      bodyTypeJson: 'JSON',
      bodyTypeText: '文本',
      bodyTypeForm: '表单',
      bodyTypeMultipart: '多段表单',
      bodyTypeBase64: 'Base64',
      middlewares: '中间件',
      openInVscode: '在 VSCode 中打开',
      queryPlaceholder: '{json}',
      headersPlaceholder: '{json}',
      bodyPlaceholderJson: '{json}',
      bodyPlaceholderText: '原始文本',
      bodyPlaceholderForm: '{sample}',
      bodyPlaceholderMultipart: '{sample}',
      bodyPlaceholderBase64: '{sample}',
      paramPlaceholder: '填写值',
      paramPlaceholderCatchall: '路径片段',
    },
    response: {
      idle: '空闲',
      empty: '暂无响应。',
      waiting: '等待响应...',
      loading: '请求中...',
      error: '错误',
      emptyPayload: '[空响应]',
    },
    errors: {
      queryJson: '查询 JSON 错误：{message}',
      headersJson: '请求头 JSON 错误：{message}',
      bodyJson: '请求体 JSON 错误：{message}',
      bodyBase64: '请求体 Base64 错误：{message}',
      routeParams: '缺少路径参数：{params}',
    },
  },
}

/**
 * Read the persisted locale from localStorage.
 *
 * @returns Locale or null when unset.
 *
 * @example
 * import { readLocale } from '@mokup/playground'
 *
 * const locale = readLocale()
 */
export function readLocale(): PlaygroundLocale | null {
  try {
    const stored = localStorage.getItem(LOCALE_KEY)
    if (stored === 'en-US' || stored === 'zh-CN') {
      return stored
    }
  }
  catch {
    // ignore storage errors
  }
  return null
}

/**
 * Persist the selected locale to localStorage.
 *
 * @param locale - Locale to persist.
 *
 * @example
 * import { persistLocale } from '@mokup/playground'
 *
 * persistLocale('zh-CN')
 */
export function persistLocale(locale: PlaygroundLocale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  }
  catch {
    // ignore storage errors
  }
}

/**
 * Vue I18n instance for the playground UI.
 *
 * @example
 * import { i18n } from '@mokup/playground'
 *
 * const locale = i18n.global.locale
 */
export const i18n = createI18n({
  legacy: false,
  locale: readLocale() ?? 'en-US',
  fallbackLocale: 'en-US',
  messages,
})
