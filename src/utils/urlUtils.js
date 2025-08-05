// API基础URL - 根据环境自动切换
let API_BASE_URL = 'https://huanst.cn/api/'
let API_SERVER_URL = 'https://huanst.cn'

// 检查是否在浏览器环境中（Vite）
const isViteEnv = typeof import.meta !== 'undefined' && import.meta.env
// 检查是否在Node.js环境中
const isNodeEnv = typeof process !== 'undefined' && process.env

// 开发环境使用本地API服务器
if ((isViteEnv && import.meta.env.MODE === 'development') ||
    (isNodeEnv && process.env.NODE_ENV === 'development')) {
  API_BASE_URL = 'http://localhost:5004/api/'
  API_SERVER_URL = 'http://localhost:5004'
}

// 也可以通过环境变量覆盖
if (isViteEnv && import.meta.env.VITE_API_BASE_URL) {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL
}
if (isViteEnv && import.meta.env.VITE_API_SERVER_URL) {
  API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL
}
if (isNodeEnv && process.env.VITE_API_BASE_URL) {
  API_BASE_URL = process.env.VITE_API_BASE_URL
}
if (isNodeEnv && process.env.VITE_API_SERVER_URL) {
  API_SERVER_URL = process.env.VITE_API_SERVER_URL
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