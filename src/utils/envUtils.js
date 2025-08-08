/**
 * 环境变量工具函数
 * 提供统一的环境变量访问接口，处理类型转换和默认值
 */

/**
 * 获取环境变量，支持类型转换和默认值
 * @param {string} key - 环境变量名称
 * @param {any} defaultValue - 默认值，当环境变量不存在时返回
 * @param {string} type - 期望的类型 ('string'|'boolean'|'number'|'array')
 * @returns {any} 转换后的环境变量值
 */
export function getEnv(key, defaultValue = '', type = 'string') {
  // 检查是否在浏览器环境中（Vite）
  const isViteEnv = typeof import.meta !== 'undefined' && import.meta.env
  // 检查是否在Node.js环境中
  const isNodeEnv = typeof process !== 'undefined' && process.env
  
  // 获取环境变量值
  let value
  if (isViteEnv && import.meta.env[key] !== undefined) {
    value = import.meta.env[key]
  } else if (isNodeEnv && process.env[key] !== undefined) {
    value = process.env[key]
  } else {
    return defaultValue
  }
  
  // 根据指定类型进行转换
  switch (type) {
    case 'boolean':
      return value === 'true' || value === true
    case 'number':
      return Number(value)
    case 'array':
      if (typeof value === 'string') {
        return value.split(',').map(item => item.trim())
      }
      return Array.isArray(value) ? value : [value]
    default:
      return value
  }
}

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
export function getApiBaseUrl() {
  return getEnv('VITE_API_BASE_URL', 'https://huanst.cn/api/')
}

/**
 * 获取API服务器URL
 * @returns {string} API服务器URL
 */
export function getApiServerUrl() {
  return getEnv('VITE_API_SERVER_URL', 'https://huanst.cn')
}

/**
 * 获取应用标题
 * @returns {string} 应用标题
 */
export function getAppTitle() {
  return getEnv('VITE_APP_TITLE', 'AI图像生成器')
}

/**
 * 获取应用版本
 * @returns {string} 应用版本
 */
export function getAppVersion() {
  return getEnv('VITE_APP_VERSION', '1.0.0')
}

/**
 * 检查是否为开发环境
 * @returns {boolean} 是否为开发环境
 */
export function isDevelopment() {
  return getEnv('NODE_ENV', 'development') === 'development'
}

/**
 * 检查是否为生产环境
 * @returns {boolean} 是否为生产环境
 */
export function isProduction() {
  return getEnv('NODE_ENV', 'development') === 'production'
}

/**
 * 检查是否启用调试模式
 * @returns {boolean} 是否启用调试模式
 */
export function isDebugEnabled() {
  return getEnv('VITE_DEBUG', isDevelopment(), 'boolean')
}

/**
 * 获取日志级别
 * @returns {string} 日志级别
 */
export function getLogLevel() {
  return getEnv('VITE_LOG_LEVEL', isDevelopment() ? 'debug' : 'error')
}

/**
 * 获取API超时设置
 * @returns {number} API超时时间（毫秒）
 */
export function getApiTimeout() {
  return getEnv('VITE_API_TIMEOUT', 30000, 'number')
}

/**
 * 获取API重试次数
 * @returns {number} API重试次数
 */
export function getApiRetryCount() {
  return getEnv('VITE_API_RETRY_COUNT', isDevelopment() ? 1 : 3, 'number')
}

/**
 * 获取支持的图像格式
 * @returns {string[]} 支持的图像格式数组
 */
export function getSupportedImageFormats() {
  return getEnv('VITE_SUPPORTED_IMAGE_FORMATS', 'png,jpg,jpeg,webp', 'array')
}

/**
 * 获取默认图像尺寸
 * @returns {string} 默认图像尺寸
 */
export function getDefaultImageSize() {
  return getEnv('VITE_DEFAULT_IMAGE_SIZE', '1024x1024')
}

/**
 * 检查是否启用性能监控
 * @returns {boolean} 是否启用性能监控
 */
export function isPerformanceMonitorEnabled() {
  return getEnv('VITE_ENABLE_PERFORMANCE_MONITOR', isProduction(), 'boolean')
}

/**
 * 检查是否启用错误上报
 * @returns {boolean} 是否启用错误上报
 */
export function isErrorReportingEnabled() {
  return getEnv('VITE_ENABLE_ERROR_REPORTING', isProduction(), 'boolean')
}

/**
 * 获取所有环境变量
 * @returns {Object} 所有环境变量对象
 */
export function getAllEnv() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env
  }
  return {}
}

// 导出默认对象，包含所有工具函数
export default {
  getEnv,
  getApiBaseUrl,
  getApiServerUrl,
  getAppTitle,
  getAppVersion,
  isDevelopment,
  isProduction,
  isDebugEnabled,
  getLogLevel,
  getApiTimeout,
  getApiRetryCount,
  getSupportedImageFormats,
  getDefaultImageSize,
  isPerformanceMonitorEnabled,
  isErrorReportingEnabled,
  getAllEnv
}