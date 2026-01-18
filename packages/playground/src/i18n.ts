import { createI18n } from 'vue-i18n'

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
      languageToggle: 'Language',
      themeToggle: 'Theme',
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
    },
    detail: {
      selectTitle: 'Select a route',
      selectHint: 'Choose a route on the left to run a request.',
      requestLabel: 'Request',
      responseLabel: 'Response',
      run: 'Run',
      query: 'Query (JSON)',
      headers: 'Headers (JSON)',
      body: 'Body (JSON)',
      middlewares: 'Middlewares',
      queryPlaceholder: '{json}',
      headersPlaceholder: '{json}',
      bodyPlaceholder: '{json}',
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
    },
  },
  'zh-CN': {
    header: {
      title: '接口调试台',
      subtitle: '查看 Mock 接口、构造请求并验证响应，无需离开开发服务器。',
      refresh: '刷新',
      routes: '{count} 条接口',
      languageToggle: '语言',
      themeToggle: '主题',
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
    },
    detail: {
      selectTitle: '请选择接口',
      selectHint: '从左侧选择一个接口开始调试。',
      requestLabel: '请求',
      responseLabel: '响应',
      run: '发送',
      query: '查询参数 (JSON)',
      headers: '请求头 (JSON)',
      body: '请求体 (JSON)',
      middlewares: '中间件',
      queryPlaceholder: '{json}',
      headersPlaceholder: '{json}',
      bodyPlaceholder: '{json}',
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
    },
  },
}

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

export function persistLocale(locale: PlaygroundLocale) {
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  }
  catch {
    // ignore storage errors
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: readLocale() ?? 'en-US',
  fallbackLocale: 'en-US',
  messages,
})
