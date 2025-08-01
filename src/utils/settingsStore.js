import { reactive } from 'vue'

// 默认设置配置
export const defaultSettings = {
  // 个人偏好
  theme: 'auto',
  language: 'zh-CN',
  autoSave: true,
  
  // 图片生成
  defaultSize: '1280x1280',
  defaultCount: 1,
  defaultModel: 'Kwai-Kolors/Kolors',
  showAdvanced: false,
  
  // 通知设置
  notifyOnComplete: true,
  systemNotify: true,
  
  // 隐私设置
  saveHistory: true,
}

// 设置状态
export const settingsState = reactive({
  ...defaultSettings
})

// 设置操作
export const settingsActions = {
  /**
   * 加载设置从本地存储
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('user_settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        Object.assign(settingsState, { ...defaultSettings, ...parsed })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
      // 如果加载失败，使用默认设置
      Object.assign(settingsState, defaultSettings)
    }
  },

  /**
   * 保存设置到本地存储
   */
  saveSettings() {
    try {
      localStorage.setItem('user_settings', JSON.stringify(settingsState))
      return true
    } catch (error) {
      console.error('保存设置失败:', error)
      return false
    }
  },

  /**
   * 重置设置为默认值
   */
  resetSettings() {
    Object.assign(settingsState, defaultSettings)
    this.saveSettings()
  },

  /**
   * 更新单个设置项
   * @param {string} key - 设置键名
   * @param {any} value - 设置值
   */
  updateSetting(key, value) {
    if (key in settingsState) {
      settingsState[key] = value
      this.saveSettings()
    }
  },

  /**
   * 获取设置值
   * @param {string} key - 设置键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 设置值
   */
  getSetting(key, defaultValue = null) {
    return settingsState[key] !== undefined ? settingsState[key] : defaultValue
  },

  /**
   * 应用图片生成设置到生成器
   * @returns {Object} 图片生成配置
   */
  getImageGenerationConfig() {
    return {
      defaultSize: settingsState.defaultSize,
      defaultCount: settingsState.defaultCount,
      defaultModel: settingsState.defaultModel,
      showAdvanced: settingsState.showAdvanced,
    }
  },

  /**
   * 应用通知设置
   * @returns {Object} 通知配置
   */
  getNotificationConfig() {
    return {
      notifyOnComplete: settingsState.notifyOnComplete,
      systemNotify: settingsState.systemNotify,
    }
  },

  /**
   * 应用隐私设置
   * @returns {Object} 隐私配置
   */
  getPrivacyConfig() {
    return {
      saveHistory: settingsState.saveHistory,
      autoSave: settingsState.autoSave,
    }
  },

  /**
   * 清除所有数据（除了用户登录信息）
   */
  clearAllData() {
    try {
      // 保存用户登录信息
      const authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
      const userInfo = localStorage.getItem('user_info') || sessionStorage.getItem('user_info')
      
      // 清除所有本地存储
      localStorage.clear()
      sessionStorage.clear()
      
      // 恢复用户登录信息
      if (authToken && userInfo) {
        const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage
        storage.setItem('auth_token', authToken)
        storage.setItem('user_info', userInfo)
      }
      
      // 重置设置为默认值
      this.resetSettings()
      
      return true
    } catch (error) {
      console.error('清除数据失败:', error)
      return false
    }
  }
}

// 初始化设置
settingsActions.loadSettings()

// 导出默认对象
export default {
  state: settingsState,
  actions: settingsActions,
  defaults: defaultSettings,
}
