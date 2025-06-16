// API基础URL - 根据环境自动切换
let API_BASE_URL = 'https://huanst.cn/api'
let API_SERVER_URL = 'https://huanst.cn'

// 开发环境使用本地API服务器
if (import.meta.env.DEV) {
  API_BASE_URL = 'http://localhost:5001/api'
  API_SERVER_URL = 'http://localhost:5001'
}

// 也可以通过环境变量覆盖
if (import.meta.env.VITE_API_BASE_URL) {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL
}
if (import.meta.env.VITE_API_SERVER_URL) {
  API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL
}

/**
 * 获取API URL，根据不同环境返回合适的URL
 * 在生产环境使用相对路径可以避免跨域问题
 * @param {string} endpoint - API端点路径
 * @returns {string} 完整的API URL
 */
export function getApiUrl(endpoint) {
  // 统一使用https://huanst.cn/api作为基础URL
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

export { API_BASE_URL, API_SERVER_URL }
