import apiClient from './apiClient'

/**
 * 用户认证相关API
 */
export const authAPI = {
  /**
   * 用户注册
   * @param {Object} userData - 包含username, email, password的用户数据
   * @returns {Promise} API响应
   */
  register(userData) {
    return apiClient.post('/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @param {string} credentials.username - 用户名
   * @param {string} credentials.password - 密码
   * @returns {Promise} API响应
   */
  login(credentials) {
    return apiClient.post('/auth/login', credentials)
  },

  /**
   * 验证令牌
   * @returns {Promise} API响应
   */
  validateToken() {
    return apiClient.post('/auth/validate-token')
  },
}

/**
 * 用户信息相关API
 */
export const userAPI = {
  /**
   * 获取用户信息
   * @returns {Promise} API响应
   */
  getProfile() {
    return apiClient.get('/user/profile')
  },
}

/**
 * 健康检查API
 */
export const healthAPI = {
  /**
   * 健康检查
   * @returns {Promise} API响应
   */
  check() {
    return apiClient.get('/health')
  },
}

/**
 * 图片生成相关API（如果后端有相关接口）
 * 注意：当前API文档中没有图片生成接口，这里预留接口结构
 */
export const imageAPI = {
  /**
   * 生成图片
   * @param {Object} params - 生成参数
   * @param {string} params.prompt - 提示词
   * @param {string} params.image_size - 图片尺寸
   * @param {number} params.batch_size - 生成数量
   * @param {string} params.model - 模型名称
   * @returns {Promise} API响应
   */
  generate(params) {
    return apiClient.post('/generate-image', params)
  },

  /**
   * 获取用户的图片生成历史（预留接口）
   * @returns {Promise} API响应
   */
  getHistory() {
    return apiClient.get('/image/history')
  },
}

// 导出所有API
export default {
  auth: authAPI,
  user: userAPI,
  health: healthAPI,
  image: imageAPI,
}