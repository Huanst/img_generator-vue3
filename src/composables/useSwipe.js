import { ref, watch, onUnmounted } from 'vue'

/**
 * 手势滑动检测 Composable
 * 
 * 支持左右上下四个方向的滑动检测
 * 可配置滑动阈值和速度
 * 
 * @param {import('vue').Ref} target - 目标元素的ref
 * @param {Object} options - 配置选项
 * @param {Function} options.onSwipeLeft - 左滑回调
 * @param {Function} options.onSwipeRight - 右滑回调
 * @param {Function} options.onSwipeUp - 上滑回调
 * @param {Function} options.onSwipeDown - 下滑回调
 * @param {number} options.threshold - 滑动阈值（默认50px）
 * @param {number} options.velocity - 最小滑动速度（默认0.3px/ms）
 * @returns {Object} { isSwiping }
 */
export function useSwipe(target, options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocity = 0.3
  } = options

  const isSwiping = ref(false)
  
  let startX = 0
  let startY = 0
  let startTime = 0
  let isTouching = false
  let currentElement = null

  /**
   * 处理触摸开始事件
   */
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return
    
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    startTime = Date.now()
    isTouching = true
    isSwiping.value = false
  }

  /**
   * 处理触摸移动事件
   */
  const handleTouchMove = (e) => {
    if (!isTouching) return
    
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = Math.abs(currentX - startX)
    const diffY = Math.abs(currentY - startY)
    
    // 如果移动距离超过阈值的一半，标记为正在滑动
    if (diffX > threshold / 2 || diffY > threshold / 2) {
      isSwiping.value = true
    }
  }

  /**
   * 处理触摸结束事件
   */
  const handleTouchEnd = (e) => {
    if (!isTouching) return
    
    const endX = e.changedTouches[0].clientX
    const endY = e.changedTouches[0].clientY
    const endTime = Date.now()
    
    const diffX = endX - startX
    const diffY = endY - startY
    const diffTime = endTime - startTime
    
    // 计算滑动速度
    const velocityX = Math.abs(diffX) / diffTime
    const velocityY = Math.abs(diffY) / diffTime
    
    // 重置状态
    isTouching = false
    isSwiping.value = false
    
    // 判断滑动方向（优先判断主要方向）
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // 水平滑动
      if (Math.abs(diffX) > threshold && velocityX > velocity) {
        if (diffX > 0 && onSwipeRight) {
          onSwipeRight({ diffX, diffY, velocityX, velocityY })
        } else if (diffX < 0 && onSwipeLeft) {
          onSwipeLeft({ diffX, diffY, velocityX, velocityY })
        }
      }
    } else {
      // 垂直滑动
      if (Math.abs(diffY) > threshold && velocityY > velocity) {
        if (diffY > 0 && onSwipeDown) {
          onSwipeDown({ diffX, diffY, velocityX, velocityY })
        } else if (diffY < 0 && onSwipeUp) {
          onSwipeUp({ diffX, diffY, velocityX, velocityY })
        }
      }
    }
  }

  /**
   * 处理触摸取消事件
   */
  const handleTouchCancel = () => {
    isTouching = false
    isSwiping.value = false
  }

  /**
   * 添加事件监听器
   */
  const addListeners = (element) => {
    if (!element) return
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true })
    currentElement = element
  }

  /**
   * 移除事件监听器
   */
  const removeListeners = () => {
    if (!currentElement) return
    
    currentElement.removeEventListener('touchstart', handleTouchStart)
    currentElement.removeEventListener('touchmove', handleTouchMove)
    currentElement.removeEventListener('touchend', handleTouchEnd)
    currentElement.removeEventListener('touchcancel', handleTouchCancel)
    currentElement = null
  }

  // 监听target变化，自动添加/移除事件监听
  const stopWatch = watch(
    () => target.value,
    (newElement, oldElement) => {
      if (oldElement) {
        removeListeners()
      }
      if (newElement) {
        addListeners(newElement)
      }
    },
    { immediate: true }
  )

  // 组件卸载时清理
  onUnmounted(() => {
    stopWatch()
    removeListeners()
  })

  return {
    isSwiping
  }
}
