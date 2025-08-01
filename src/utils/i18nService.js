import { reactive, computed } from 'vue'
import zhCN from '@/locales/zh-CN.js'
import enUS from '@/locales/en-US.js'

// 支持的语言列表
export const SUPPORTED_LANGUAGES = {
  'zh-CN': {
    name: '简体中文',
    nativeName: '简体中文',
    flag: '🇨🇳'
  },
  'en-US': {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  }
}

// 语言包映射
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 国际化状态
const i18nState = reactive({
  locale: 'zh-CN', // 默认语言
  fallbackLocale: 'zh-CN'
})

/**
 * 国际化服务类
 */
class I18nService {
  constructor() {
    this.state = i18nState
    this.messages = messages
    this.loadLocaleFromStorage()
  }

  /**
   * 从本地存储加载语言设置
   */
  loadLocaleFromStorage() {
    try {
      const savedLocale = localStorage.getItem('app_locale')
      if (savedLocale && this.messages[savedLocale]) {
        this.state.locale = savedLocale
      } else {
        // 检测浏览器语言
        const browserLang = this.detectBrowserLanguage()
        this.state.locale = browserLang
      }
    } catch (error) {
      console.warn('Failed to load locale from storage:', error)
    }
  }

  /**
   * 检测浏览器语言
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage
    
    // 精确匹配
    if (this.messages[browserLang]) {
      return browserLang
    }
    
    // 模糊匹配（例如 en-GB -> en-US）
    const langCode = browserLang.split('-')[0]
    const matchedLocale = Object.keys(this.messages).find(locale => 
      locale.startsWith(langCode)
    )
    
    return matchedLocale || this.state.fallbackLocale
  }

  /**
   * 设置当前语言
   * @param {string} locale - 语言代码
   */
  setLocale(locale) {
    if (!this.messages[locale]) {
      console.warn(`Locale ${locale} is not supported`)
      return false
    }

    this.state.locale = locale
    
    // 保存到本地存储
    try {
      localStorage.setItem('app_locale', locale)
    } catch (error) {
      console.warn('Failed to save locale to storage:', error)
    }

    // 设置HTML lang属性
    document.documentElement.setAttribute('lang', locale)
    
    return true
  }

  /**
   * 获取当前语言
   */
  getLocale() {
    return this.state.locale
  }

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键，支持点号分隔的嵌套键
   * @param {Object} params - 参数对象，用于替换占位符
   * @returns {string} 翻译后的文本
   */
  t(key, params = {}) {
    const keys = key.split('.')
    let message = this.messages[this.state.locale]
    
    // 遍历嵌套键
    for (const k of keys) {
      if (message && typeof message === 'object' && message[k] !== undefined) {
        message = message[k]
      } else {
        // 尝试回退语言
        message = this.messages[this.state.fallbackLocale]
        for (const fallbackKey of keys) {
          if (message && typeof message === 'object' && message[fallbackKey] !== undefined) {
            message = message[fallbackKey]
          } else {
            console.warn(`Translation key "${key}" not found`)
            return key // 返回原始键作为后备
          }
        }
        break
      }
    }

    // 如果最终结果不是字符串，返回原始键
    if (typeof message !== 'string') {
      console.warn(`Translation key "${key}" does not resolve to a string`)
      return key
    }

    // 替换参数占位符
    return this.interpolate(message, params)
  }

  /**
   * 插值替换参数
   * @param {string} message - 包含占位符的消息
   * @param {Object} params - 参数对象
   * @returns {string} 替换后的消息
   */
  interpolate(message, params) {
    if (!params || Object.keys(params).length === 0) {
      return message
    }

    return message.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match
    })
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES
  }

  /**
   * 检查是否支持指定语言
   * @param {string} locale - 语言代码
   */
  isSupported(locale) {
    return !!this.messages[locale]
  }

  /**
   * 获取语言信息
   * @param {string} locale - 语言代码
   */
  getLanguageInfo(locale) {
    return SUPPORTED_LANGUAGES[locale] || null
  }

  /**
   * 格式化日期
   * @param {Date|string|number} date - 日期
   * @param {Object} options - 格式化选项
   */
  formatDate(date, options = {}) {
    const dateObj = new Date(date)
    const locale = this.state.locale.replace('-', '_') // 转换为标准格式
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }

    try {
      return dateObj.toLocaleDateString(locale, defaultOptions)
    } catch (error) {
      console.warn('Date formatting failed:', error)
      return dateObj.toLocaleDateString('en-US', defaultOptions)
    }
  }

  /**
   * 格式化数字
   * @param {number} number - 数字
   * @param {Object} options - 格式化选项
   */
  formatNumber(number, options = {}) {
    const locale = this.state.locale.replace('-', '_')
    
    try {
      return number.toLocaleString(locale, options)
    } catch (error) {
      console.warn('Number formatting failed:', error)
      return number.toLocaleString('en-US', options)
    }
  }
}

// 创建单例实例
export const i18nService = new I18nService()

// 导出便捷方法
export const t = (key, params) => i18nService.t(key, params)
export const setLocale = (locale) => i18nService.setLocale(locale)
export const getLocale = () => i18nService.getLocale()

// 响应式的当前语言
export const currentLocale = computed(() => i18nState.locale)

// 响应式的翻译函数
export const useI18n = () => {
  return {
    t: (key, params) => i18nService.t(key, params),
    locale: currentLocale,
    setLocale: i18nService.setLocale.bind(i18nService),
    getLocale: i18nService.getLocale.bind(i18nService),
    getSupportedLanguages: i18nService.getSupportedLanguages.bind(i18nService),
    formatDate: i18nService.formatDate.bind(i18nService),
    formatNumber: i18nService.formatNumber.bind(i18nService)
  }
}

export default i18nService
