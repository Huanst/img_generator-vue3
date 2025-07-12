import axios from 'axios'
import { API_BASE_URL, getApiUrl } from './urlUtils'
import { ElMessage } from 'element-plus'
import { 
  isWeChatBrowser, 
  getWeChatAxiosConfig, 
  handleWeChatNetworkError,
  wechatRetryRequest 
} from './wechatCompat'

// 创建axios实例
const baseConfig = {
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 允许跨域请求携带凭证
}

// 合并微信浏览器特殊配置
const apiClient = axios.create({
  ...baseConfig,
  ...getWeChatAxiosConfig()
})

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 从本地存储获取token
    const token =
      localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')

    // 如果存在token则添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 调试信息
    if (import.meta.env.DEV) {
      // console.log('API请求:', {
      //   url: config.url,
      //   method: config.method,
      //   params: config.params,
      //   data: config.data,
      //   headers: {
      //     ...config.headers,
      //     Authorization: config.headers.Authorization ? '已设置' : '未设置',
      //   },
      // })
    }

    return config
  },
  error => {
    // console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    // 调试信息
    if (import.meta.env.DEV) {
      // console.log('API响应成功:', {
      //   url: response.config.url,
      //   status: response.status,
      //   data: response.data,
      // })
    }

    return response
  },
  error => {
    // 处理响应错误
    if (import.meta.env.DEV) {
      // console.error('API响应错误:', {
      //   url: error.config?.url,
      //   status: error.response?.status,
      //   statusText: error.response?.statusText,
      //   data: error.response?.data,
      //   message: error.message,
      // })
    }

    // 处理特定错误码
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并重定向到登录页
          localStorage.removeItem('auth_token')
          sessionStorage.removeItem('auth_token')

          ElMessage({
            type: 'error',
            message: '登录已过期，请重新登录',
            duration: 3000,
          })

          // 如果需要重定向到登录页，可以在这里添加代码
          // window.location.href = '/login'
          break

        case 403:
          ElMessage({
            type: 'error',
            message: '您没有权限执行此操作',
            duration: 3000,
          })
          break

        case 404:
          ElMessage({
            type: 'error',
            message: '请求的资源不存在',
            duration: 3000,
          })
          break

        case 500:
          ElMessage({
            type: 'error',
            message: '服务器内部错误，请稍后再试',
            duration: 3000,
          })
          break
      }
    } else if (error.request) {
      // 请求发出但没有响应
      // 尝试使用微信专用错误处理
      const wechatErrorMsg = handleWeChatNetworkError(error)
      if (wechatErrorMsg) {
        ElMessage({
          type: 'error',
          message: wechatErrorMsg,
          duration: 5000,
        })
      } else {
        // 通用错误处理
        if (error.message && error.message.includes('Network Error')) {
          ElMessage({
            type: 'error',
            message: '网络错误，可能是跨域(CORS)问题或服务器无法连接',
            duration: 5000,
          })
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          ElMessage({
            type: 'error',
            message: '请求超时，请检查网络连接',
            duration: 3000,
          })
        } else {
          ElMessage({
            type: 'error',
            message: '无法连接到服务器，请检查网络连接',
            duration: 3000,
          })
        }
      }
    } else {
      // 请求设置时出错
      ElMessage({
        type: 'error',
        message: '请求发送失败: ' + error.message,
        duration: 3000,
      })
    }

    return Promise.reject(error)
  }
)

export default apiClient
