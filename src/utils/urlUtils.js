// API基础URL - 服务器CORS仅允许http://huanst.cn域名
let API_BASE_URL = 'http://huanst.cn/api'
let API_SERVER_URL = 'http://huanst.cn'

// 根据当前环境决定是否使用本地API（开发环境）
if (import.meta.env.DEV) {
  API_BASE_URL = 'http://localhost:5001/api'
  API_SERVER_URL = 'http://localhost:5001'
}

export { API_BASE_URL, API_SERVER_URL }
