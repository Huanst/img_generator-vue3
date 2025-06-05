// API基础URL - 确保使用HTTPS避免混合内容问题
let API_BASE_URL = 'https://huanst.cn/api'
let API_SERVER_URL = 'https://huanst.cn'

// 根据当前环境决定是否使用本地API（开发环境）
if (import.meta.env.DEV) {
  API_BASE_URL = 'http://localhost:5001/api'
  API_SERVER_URL = 'http://localhost:5001'
}

/**
 * 获取API URL，根据不同环境返回合适的URL
 * 在生产环境使用相对路径可以避免跨域问题
 * @param {string} endpoint - API端点路径
 * @returns {string} 完整的API URL
 */
export function getApiUrl(endpoint) {
  // 开发环境使用完整URL
  if (import.meta.env.DEV) {
    return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
  }

  // 生产环境使用相对路径，避免跨域问题
  return `/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

export { API_BASE_URL, API_SERVER_URL }
