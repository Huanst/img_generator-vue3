import { ref, h, render } from 'vue'
import MobileToast from '@/components/mobile/MobileToast.vue'

// 全局Toast状态
const toastState = ref({
  visible: false,
  message: '',
  type: 'info',
  closable: false
})

let toastContainer = null
let hideTimer = null

/**
 * 显示Toast
 * @param {string} message - 消息内容
 * @param {string} type - 类型 (success, error, info)
 * @param {number} duration - 显示时长（毫秒），0表示不自动关闭
 */
const showToast = (message, type = 'info', duration = 3000) => {
  // 清除之前的定时器
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  // 更新Toast状态
  toastState.value = {
    visible: true,
    message,
    type,
    closable: duration === 0
  }

  // 创建Toast容器（如果不存在）
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'mobile-toast-container'
    document.body.appendChild(toastContainer)
  }

  // 渲染Toast组件
  const vnode = h(MobileToast, {
    visible: toastState.value.visible,
    message: toastState.value.message,
    type: toastState.value.type,
    closable: toastState.value.closable,
    onClose: hideToast
  })

  render(vnode, toastContainer)

  // 自动隐藏
  if (duration > 0) {
    hideTimer = setTimeout(() => {
      hideToast()
    }, duration)
  }
}

/**
 * 隐藏Toast
 */
const hideToast = () => {
  toastState.value.visible = false

  // 延迟清理DOM，等待动画完成
  setTimeout(() => {
    if (toastContainer) {
      render(null, toastContainer)
    }
  }, 300)
}

/**
 * Toast Composable
 * @returns {Object} Toast方法
 */
export function useToast() {
  return {
    /**
     * 显示成功Toast
     * @param {string} message - 消息内容
     * @param {number} duration - 显示时长（毫秒）
     */
    success: (message, duration = 3000) => {
      showToast(message, 'success', duration)
    },

    /**
     * 显示错误Toast
     * @param {string} message - 消息内容
     * @param {number} duration - 显示时长（毫秒）
     */
    error: (message, duration = 3000) => {
      showToast(message, 'error', duration)
    },

    /**
     * 显示信息Toast
     * @param {string} message - 消息内容
     * @param {number} duration - 显示时长（毫秒）
     */
    info: (message, duration = 3000) => {
      showToast(message, 'info', duration)
    },

    /**
     * 隐藏Toast
     */
    hide: hideToast
  }
}
