/**
 * 生产环境安全的日志工具
 * 在生产环境下禁用所有日志输出，开发环境下正常输出
 */

// 获取环境变量
const isDevelopment = import.meta.env.MODE === 'development'
const isDebugEnabled = import.meta.env.VITE_DEBUG === 'true'
const logLevel = import.meta.env.VITE_LOG_LEVEL || 'info'

// 日志级别映射
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

/**
 * 获取当前日志级别
 * @returns {number} 日志级别数值
 */
const getCurrentLogLevel = () => {
  return LOG_LEVELS[logLevel] || LOG_LEVELS.info
}

/**
 * 检查是否应该输出日志
 * @param {string} level - 日志级别
 * @returns {boolean} 是否应该输出
 */
const shouldLog = (level) => {
  if (!isDevelopment && !isDebugEnabled) {
    return level === 'error' // 生产环境只输出错误
  }
  return LOG_LEVELS[level] <= getCurrentLogLevel()
}

/**
 * 格式化日志消息
 * @param {string} level - 日志级别
 * @param {string} message - 消息内容
 * @param {...any} args - 额外参数
 * @returns {Array} 格式化后的参数数组
 */
const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  return [prefix, message, ...args]
}

/**
 * 日志工具类
 */
class Logger {
  /**
   * 错误日志 - 生产环境也会输出
   * @param {string} message - 错误消息
   * @param {...any} args - 额外参数
   */
  static error(message, ...args) {
    if (shouldLog('error')) {
      console.error(...formatMessage('error', message, ...args))
    }
  }

  /**
   * 警告日志 - 仅开发环境输出
   * @param {string} message - 警告消息
   * @param {...any} args - 额外参数
   */
  static warn(message, ...args) {
    if (shouldLog('warn')) {
      console.warn(...formatMessage('warn', message, ...args))
    }
  }

  /**
   * 信息日志 - 仅开发环境输出
   * @param {string} message - 信息消息
   * @param {...any} args - 额外参数
   */
  static info(message, ...args) {
    if (shouldLog('info')) {
      console.info(...formatMessage('info', message, ...args))
    }
  }

  /**
   * 调试日志 - 仅开发环境且启用调试时输出
   * @param {string} message - 调试消息
   * @param {...any} args - 额外参数
   */
  static debug(message, ...args) {
    if (shouldLog('debug')) {
      console.log(...formatMessage('debug', message, ...args))
    }
  }

  /**
   * 普通日志 - 仅开发环境输出
   * @param {string} message - 日志消息
   * @param {...any} args - 额外参数
   */
  static log(message, ...args) {
    if (shouldLog('info')) {
      console.log(...formatMessage('info', message, ...args))
    }
  }

  /**
   * 表格日志 - 仅开发环境输出
   * @param {any} data - 表格数据
   */
  static table(data) {
    if (shouldLog('debug')) {
      console.table(data)
    }
  }

  /**
   * 分组日志开始 - 仅开发环境输出
   * @param {string} label - 分组标签
   */
  static group(label) {
    if (shouldLog('debug')) {
      console.group(label)
    }
  }

  /**
   * 分组日志结束 - 仅开发环境输出
   */
  static groupEnd() {
    if (shouldLog('debug')) {
      console.groupEnd()
    }
  }

  /**
   * 性能计时开始 - 仅开发环境输出
   * @param {string} label - 计时标签
   */
  static time(label) {
    if (shouldLog('debug')) {
      console.time(label)
    }
  }

  /**
   * 性能计时结束 - 仅开发环境输出
   * @param {string} label - 计时标签
   */
  static timeEnd(label) {
    if (shouldLog('debug')) {
      console.timeEnd(label)
    }
  }
}

export default Logger