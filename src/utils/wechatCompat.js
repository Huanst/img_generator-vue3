/**
 * 微信浏览器兼容性工具
 * 处理微信内置浏览器的特殊情况和限制
 */

/**
 * 检测是否在微信浏览器中
 * @returns {boolean}
 */
export const isWeChatBrowser = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

/**
 * 检测是否在微信小程序webview中
 * @returns {boolean}
 */
export const isWeChatMiniProgram = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('miniprogram')
}

/**
 * 获取微信浏览器版本
 * @returns {string|null}
 */
export const getWeChatVersion = () => {
  const ua = navigator.userAgent.toLowerCase()
  const match = ua.match(/micromessenger\/(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

/**
 * 微信浏览器的axios配置
 * @returns {Object}
 */
export const getWeChatAxiosConfig = () => {
  if (!isWeChatBrowser()) {
    return {}
  }

  return {
    // 增加超时时间
    timeout: 30000,
    // 强制使用XHR适配器
    adapter: 'xhr',
    // 禁用重定向
    maxRedirects: 0,
    // 添加特殊头部
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    // 重试配置
    retry: 3,
    retryDelay: 1000
  }
}

/**
 * 处理微信浏览器的网络错误
 * @param {Error} error - 错误对象
 * @returns {string} 用户友好的错误消息
 */
export const handleWeChatNetworkError = (error) => {
  if (!isWeChatBrowser()) {
    return null
  }

  if (error.message && error.message.includes('Network Error')) {
    return '微信浏览器网络请求失败，请尝试刷新页面或稍后再试'
  }

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return '微信浏览器请求超时，请检查网络连接'
  }

  if (error.response && error.response.status === 0) {
    return '微信浏览器安全策略限制，请在浏览器中打开'
  }

  return '微信浏览器请求失败，建议在浏览器中打开'
}

/**
 * 微信浏览器环境初始化
 * 设置一些必要的兼容性处理
 */
export const initWeChatCompat = () => {
  if (!isWeChatBrowser()) {
    return
  }

  // 禁用微信的图片长按保存菜单
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault()
    }
  })

  // 处理微信浏览器的返回按钮
  window.addEventListener('popstate', (e) => {
    // 可以在这里添加特殊的返回处理逻辑
  })

  // 设置viewport以防止微信浏览器缩放
  const viewport = document.querySelector('meta[name="viewport"]')
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
    )
  }
}

/**
 * 检查微信浏览器是否支持某个功能
 * @param {string} feature - 功能名称
 * @returns {boolean}
 */
export const checkWeChatFeatureSupport = (feature) => {
  if (!isWeChatBrowser()) {
    return true // 非微信浏览器默认支持
  }

  const version = getWeChatVersion()
  if (!version) {
    return false
  }

  const [major, minor, patch] = version.split('.').map(Number)

  switch (feature) {
    case 'fetch':
      // 微信浏览器 6.5.0+ 支持 fetch
      return major > 6 || (major === 6 && minor >= 5)
    case 'websocket':
      // 微信浏览器 6.3.0+ 支持 WebSocket
      return major > 6 || (major === 6 && minor >= 3)
    case 'canvas':
      // 大部分版本都支持 Canvas
      return true
    case 'webgl':
      // 微信浏览器 6.6.0+ 支持 WebGL
      return major > 6 || (major === 6 && minor >= 6)
    default:
      return true
  }
}

/**
 * 微信浏览器专用的错误重试机制
 * @param {Function} requestFn - 请求函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟
 * @returns {Promise}
 */
export const wechatRetryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      lastError = error
      
      // 如果不是网络错误，直接抛出
      if (!error.message?.includes('Network Error') && error.code !== 'ECONNABORTED') {
        throw error
      }
      
      // 最后一次重试失败，抛出错误
      if (i === maxRetries) {
        throw lastError
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  
  throw lastError
}

export default {
  isWeChatBrowser,
  isWeChatMiniProgram,
  getWeChatVersion,
  getWeChatAxiosConfig,
  handleWeChatNetworkError,
  initWeChatCompat,
  checkWeChatFeatureSupport,
  wechatRetryRequest
}