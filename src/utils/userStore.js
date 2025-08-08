import { reactive } from 'vue'
import { authAPI, userAPI } from './apiService'
import apiClient from './apiClient'
import { ElMessage } from 'element-plus'

/**
 * 用户状态管理
 * 使用 Vue 3 的 reactive API 创建响应式状态
 */
export const userState = reactive({
  isLoggedIn: false,
  userInfo: null,
  token: null,
})

/**
 * 用户操作方法集合
 */
export const userActions = {
  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @param {string} credentials.username - 用户名
   * @param {string} credentials.password - 密码
   * @param {boolean} remember - 是否记住登录状态
   * @returns {Promise<Object>} 登录结果
   */
  async login(credentials, remember = false) {
    try {
      const response = await authAPI.login(credentials)
      
      // 修复：后端返回的是 success 字段，不是 status 字段
      // 支持多种成功状态格式：true, 'true', 1, '1'
      if (response.data.success === true || response.data.success === 'true' || 
          response.data.success === 1 || response.data.success === '1') {
        
        // 安全地检查和解构数据
        if (!response.data.data) {
          throw new Error('服务器返回数据格式错误')
        }
        
        const { token, user } = response.data.data
        
        if (!token || !user) {
          throw new Error('登录响应缺少必要信息')
        }
        
        // 更新状态
        userState.isLoggedIn = true
        userState.userInfo = user
        userState.token = token
        
        // 存储到本地存储
        const storage = remember ? localStorage : sessionStorage
        storage.setItem('auth_token', token)
        storage.setItem('user_info', JSON.stringify(user))
        
        // 设置默认请求头
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        ElMessage({
          type: 'success',
          message: response.data.message || '登录成功',
          duration: 2000,
        })
        
        return { success: true, user }
      } else {
        // 避免抛出包含"成功"字样的错误信息
        const errorMsg = response.data.message && !response.data.message.includes('成功') 
          ? response.data.message 
          : '登录失败，请检查用户名和密码'
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error('登录错误:', error)
      
      // 处理错误信息显示
      let errorMessage = '登录失败，请稍后重试'
      
      if (error.response?.data?.message) {
        // 如果是API返回的错误信息
        errorMessage = error.response.data.message
      } else if (error.message && !error.message.includes('成功')) {
        // 如果是自定义错误且不包含"成功"字样，使用错误信息
        errorMessage = error.message
      }
      
      ElMessage({
        type: 'error',
        message: errorMessage,
        duration: 3000,
      })
      
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 用户注册
   * @param {Object} userData - 注册用户数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.email - 邮箱
   * @param {string} userData.password - 密码
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    try {
      const response = await authAPI.register(userData)
      
      if (response.data.success === true) {
        ElMessage({
          type: 'success',
          message: response.data.message || '注册成功，请登录',
          duration: 3000,
        })
        
        return { success: true }
      } else {
        throw new Error(response.data.message || '注册失败')
      }
    } catch (error) {
      console.error('注册错误:', error)
      
      let errorMessage = '注册失败，请稍后重试'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      ElMessage({
        type: 'error',
        message: errorMessage,
        duration: 3000,
      })
      
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 用户登出
   */
  logout() {
    // 清除状态
    userState.isLoggedIn = false
    userState.userInfo = null
    userState.token = null
    
    // 清除本地存储
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('user_info')
    
    // 清除默认请求头
    delete apiClient.defaults.headers.common['Authorization']
    
    ElMessage({
      type: 'info',
      message: '已退出登录',
      duration: 2000,
    })
  },

  /**
   * 验证token有效性
   * @returns {Promise<boolean>} 验证结果
   */
  async validateToken() {
    try {
      const response = await authAPI.validateToken()
      
      if (response.data.success === true) {
        return true
      } else {
        // Token无效，清除状态
        this.logout()
        return false
      }
    } catch (error) {
      console.error('Token验证失败:', error)
      // Token验证失败，清除状态
      this.logout()
      return false
    }
  },

  /**
   * 从本地存储恢复用户状态
   * @returns {Promise<boolean>} 恢复结果
   */
  async restoreFromStorage() {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
    
    if (token && storedUser) {
      try {
        userState.token = token
        userState.userInfo = JSON.parse(storedUser)
        
        // 设置默认请求头
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // 验证token是否仍然有效
        const isValid = await this.validateToken()
        
        if (isValid) {
          userState.isLoggedIn = true
          return true
        }
      } catch (error) {
        console.error('恢复用户状态失败:', error)
        this.logout()
      }
    }
    
    return false
  },

  /**
   * 获取用户详细信息
   * @returns {Promise<Object>} 用户信息
   */
  async getUserProfile() {
    try {
      const response = await userAPI.getProfile()
      
      if (response.data.success === true) {
        userState.userInfo = response.data.data.user
        
        // 更新本地存储中的用户信息
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
        storage.setItem('user_info', JSON.stringify(userState.userInfo))
        
        return { success: true, user: userState.userInfo }
      } else {
        throw new Error(response.data.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息错误:', error)
      
      let errorMessage = '获取用户信息失败'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      ElMessage({
        type: 'error',
        message: errorMessage,
        duration: 3000,
      })
      
      return { success: false, error: errorMessage }
    }
  },

  /**
   * 更新用户信息
   * @param {Object} updateData - 要更新的用户数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateProfile(updateData) {
    try {
      const response = await userAPI.updateProfile(updateData)
      
      if (response.data.success === true) {
        // 更新本地状态
        userState.userInfo = { ...userState.userInfo, ...response.data.data.user }
        
        // 更新本地存储
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
        storage.setItem('user_info', JSON.stringify(userState.userInfo))
        
        ElMessage({
          type: 'success',
          message: response.data.message || '更新成功',
          duration: 2000,
        })
        
        return { success: true, user: userState.userInfo }
      } else {
        throw new Error(response.data.message || '更新失败')
      }
    } catch (error) {
      console.error('更新用户信息错误:', error)
      
      let errorMessage = '更新失败，请稍后重试'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      ElMessage({
        type: 'error',
        message: errorMessage,
        duration: 3000,
      })
      
      return { success: false, error: errorMessage }
    }
  }
}

// 默认导出
export default {
  userState,
  userActions
}