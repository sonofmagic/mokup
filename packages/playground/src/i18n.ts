import { createI18n } from 'vue-i18n'
import enMessages from './i18n/messages-en'
import zhMessages from './i18n/messages-zh'

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
  'en-US': enMessages,
  'zh-CN': zhMessages,
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
