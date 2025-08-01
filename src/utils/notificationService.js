import { settingsState } from './settingsStore'

/**
 * 通知服务
 * 处理浏览器通知和系统消息
 */
export class NotificationService {
  constructor() {
    this.permission = 'default'
    this.checkPermission()
  }

  /**
   * 检查通知权限
   */
  async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission
      
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission()
      }
    }
    return this.permission === 'granted'
  }

  /**
   * 发送通知
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   * @param {Object} options - 通知选项
   */
  async sendNotification(title, body, options = {}) {
    // 检查设置是否允许通知
    if (!settingsState.notifyOnComplete && !settingsState.systemNotify) {
      return false
    }

    // 检查浏览器支持
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知功能')
      return false
    }

    // 检查权限
    if (this.permission !== 'granted') {
      const granted = await this.checkPermission()
      if (!granted) {
        console.warn('通知权限未授予')
        return false
      }
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'img-generator',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options
      })

      // 设置点击事件
      if (options.onClick) {
        notification.onclick = options.onClick
      }

      // 自动关闭
      if (options.autoClose !== false) {
        setTimeout(() => {
          notification.close()
        }, options.duration || 5000)
      }

      return true
    } catch (error) {
      console.error('发送通知失败:', error)
      return false
    }
  }

  /**
   * 发送图片生成完成通知
   * @param {number} count - 生成的图片数量
   * @param {string} prompt - 生成提示词
   */
  async notifyImageGenerated(count, prompt) {
    if (!settingsState.notifyOnComplete) {
      return false
    }

    const title = '图片生成完成'
    const body = `成功生成 ${count} 张图片\n提示词: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`
    
    return await this.sendNotification(title, body, {
      tag: 'image-generated',
      icon: '/favicon.ico',
      onClick: () => {
        window.focus()
        // 可以添加跳转到结果页面的逻辑
      }
    })
  }

  /**
   * 发送系统消息通知
   * @param {string} message - 系统消息
   * @param {string} type - 消息类型 (info, warning, error)
   */
  async notifySystemMessage(message, type = 'info') {
    if (!settingsState.systemNotify) {
      return false
    }

    let title = '系统消息'
    let icon = '/favicon.ico'

    switch (type) {
      case 'warning':
        title = '系统警告'
        break
      case 'error':
        title = '系统错误'
        break
      case 'success':
        title = '系统提示'
        break
    }

    return await this.sendNotification(title, message, {
      tag: 'system-message',
      icon,
      requireInteraction: type === 'error',
      onClick: () => {
        window.focus()
      }
    })
  }

  /**
   * 发送测试通知
   */
  async sendTestNotification() {
    return await this.sendNotification(
      '测试通知',
      '这是一条测试通知，用于验证通知功能是否正常工作。',
      {
        tag: 'test-notification',
        autoClose: true,
        duration: 3000
      }
    )
  }

  /**
   * 清除所有通知
   */
  clearAllNotifications() {
    // 现代浏览器不支持清除所有通知的API
    // 这里只是一个占位符方法
    console.log('清除所有通知')
  }
}

// 创建单例实例
export const notificationService = new NotificationService()

// 导出便捷方法
export const {
  sendNotification,
  notifyImageGenerated,
  notifySystemMessage,
  sendTestNotification,
  checkPermission
} = notificationService

export default notificationService
