import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 移动端设备检测 Composable
 * 
 * 检测设备屏幕宽度并提供响应式的 isMobile 状态
 * 支持窗口 resize 事件监听和 localStorage 持久化
 * 
 * @param {number} breakpoint - 移动端断点，默认 768px
 * @returns {Object} { isMobile, screenWidth }
 */
export function useMobileDetect(breakpoint = 768) {
  // 响应式状态
  const isMobile = ref(false)
  const screenWidth = ref(0)
  
  // 从 localStorage 读取用户偏好
  const STORAGE_KEY = 'mobile-ui-preference'
  
  /**
   * 检测设备类型
   * 根据屏幕宽度判断是否为移动端
   */
  const checkDevice = () => {
    screenWidth.value = window.innerWidth
    const newIsMobile = screenWidth.value < breakpoint
    
    // 只有状态真正改变时才更新
    if (isMobile.value !== newIsMobile) {
      isMobile.value = newIsMobile
      
      // 持久化到 localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          isMobile: newIsMobile,
          screenWidth: screenWidth.value,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.warn('Failed to save mobile preference to localStorage:', error)
      }
    }
  }
  
  /**
   * 从 localStorage 恢复用户偏好
   * 仅在首次加载时使用，之后以实际屏幕宽度为准
   */
  const restorePreference = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const preference = JSON.parse(stored)
        // 如果存储的偏好在24小时内，使用它作为初始值
        const isRecent = Date.now() - preference.timestamp < 24 * 60 * 60 * 1000
        if (isRecent && typeof preference.isMobile === 'boolean') {
          isMobile.value = preference.isMobile
          screenWidth.value = preference.screenWidth || window.innerWidth
        }
      }
    } catch (error) {
      console.warn('Failed to restore mobile preference from localStorage:', error)
    }
  }
  
  // 防抖处理 resize 事件
  let resizeTimer = null
  const handleResize = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    resizeTimer = setTimeout(() => {
      checkDevice()
    }, 150) // 150ms 防抖延迟
  }
  
  // 组件挂载时初始化
  onMounted(() => {
    // 先恢复偏好，再检测实际设备
    restorePreference()
    checkDevice()
    
    // 监听窗口 resize 事件
    window.addEventListener('resize', handleResize)
    
    // 监听屏幕方向变化（移动设备旋转）
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', checkDevice)
    }
  })
  
  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.removeEventListener('change', checkDevice)
    }
    
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
  })
  
  return {
    isMobile,
    screenWidth
  }
}
