import { reactive } from 'vue'
import { authAPI, userAPI } from './apiService'
import apiClient from './apiClient'
import { ElMessage } from 'element-plus'

// 用户状态
export const userState = reactive({
  isLoggedIn: false,
  userInfo: null,
  token: null,
})

// 用户操作
export const userActions = {
  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @param {boolean} remember - 是否记住登录状态
   * @returns {Promise} 登录结果
   */
  async login(credentials, remember = false) {
    try {
      const response = await authAPI.login(credentials)
      
      if (response.data.status === 'success') {
        const { token, user } = response.data.data
        
        // 更新状态
        userState.isLoggedIn = true
        userState.userInfo = user
        userState.token = token
        
        // 存储到本地
        const storage = remember ? localStorage : sessionStorage
        storage.setItem('auth_token', token)
        storage.setItem('user_info', JSON.stringify(user))
        
        // 设置axios默认Authorization头
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        ElMessage({
          type: 'success',
          message: response.data.message || '登录成功',
          duration: 2000,
        })
        
        return { success: true, user }
      } else {
        throw new Error(response.data.message || '登录失败')
      }
    } catch (error) {
      console.error('登录错误:', error)
      
      let errorMessage = '登录失败，请重试'
      
      if (error.response) {
        switch (error.response.status) {
          case 400:
            errorMessage = '请求参数不正确，请检查用户名和密码'
            break
          case 401:
            errorMessage = '用户名或密码错误'
            break
          case 404:
            errorMessage = '用户不存在'
            break
          case 500:
            errorMessage = '服务器内部错误，请稍后再试'
            break
          default:
            errorMessage = error.response.data?.message || errorMessage
        }
      } else if (error.request) {
        errorMessage = '无法连接到服务器，请检查网络连接'
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
   * @returns {Promise} 注册结果
   */
  async register(userData) {
    try {
      const response = await authAPI.register(userData)
      
      if (response.data.status === 'success') {
        ElMessage({
          type: 'success',
          message: response.data.message || '注册成功，请登录',
          duration: 2000,
        })
        
        return { success: true, data: response.data.data }
      } else {
        throw new Error(response.data.message || '注册失败')
      }
    } catch (error) {
      console.error('注册失败:', error)
      
      let errorMessage = '注册失败，请稍后重试'
      
      if (error.response) {
        const status = error.response.status
        const data = error.response.data
        
        switch (status) {
          case 400:
            errorMessage = data.message || '请求参数错误'
            break
          case 409:
            errorMessage = data.message || '用户名或邮箱已存在'
            break
          case 500:
            errorMessage = '服务器内部错误，请稍后重试'
            break
          default:
            errorMessage = data.message || `注册失败 (${status})`
        }
      } else if (error.request) {
        errorMessage = '网络连接失败，请检查网络设置'
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
    
    // 清除axios默认Authorization头
    delete apiClient.defaults.headers.common['Authorization']
    
    ElMessage({
      type: 'info',
      message: '已退出登录',
      duration: 2000,
    })
  },

  /**
   * 验证token有效性
   * @returns {Promise} 验证结果
   */
  async validateToken() {
    try {
      const response = await authAPI.validateToken()
      
      if (response.data.status === 'success') {
        // 更新用户信息
        if (response.data.data?.user) {
          userState.userInfo = response.data.data.user
        }
        return { success: true }
      } else {
        throw new Error('Token无效')
      }
    } catch (error) {
      console.error('Token验证失败:', error)
      this.logout()
      return { success: false }
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
        userState.isLoggedIn = true
        
        // 设置axios默认Authorization头
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        // 验证token有效性并获取最新用户信息
        const validationResult = await this.validateToken()
        
        if (validationResult.success) {
          // 获取最新的用户信息，包括头像URL
          await this.getUserProfile()
        }
        
        return validationResult.success
      } catch (error) {
        console.error('恢复用户状态失败:', error)
        this.logout()
        return false
      }
    }
    
    return false
  },

  /**
   * 获取用户详细信息
   * @returns {Promise} 用户信息
   */
  async getUserProfile() {
    try {
      const response = await userAPI.getProfile()
      
      if (response.data.status === 'success') {
        userState.userInfo = response.data.data.user
        
        // 更新本地存储中的用户信息
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
        storage.setItem('user_info', JSON.stringify(userState.userInfo))
        
        return { success: true, user: response.data.data.user }
      } else {
        throw new Error('获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息错误:', error)
      return { success: false, error: error.message }
    }
  },
}

// 导出默认对象
export default {
  state: userState,
  actions: userActions,
}