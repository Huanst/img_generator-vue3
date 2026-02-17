import { ref, watch, onUnmounted } from 'vue'

/**
 * 下拉刷新 Composable
 * 
 * 监听下拉手势并触发刷新回调
 * 
 * @param {import('vue').Ref} target - 目标元素的ref
 * @param {Object} options - 配置选项
 * @param {Function} options.onRefresh - 刷新回调函数
 * @param {number} options.threshold - 触发刷新的阈值（默认80px）
 * @param {number} options.maxDistance - 最大下拉距离（默认120px）
 * @returns {Object} { isRefreshing, pullDistance }
 */
export function usePullToRefresh(target, options = {}) {
  const {
    onRefresh,
    threshold = 80,
    maxDistance = 120
  } = options

  const isRefreshing = ref(false)
  const pullDistance = ref(0)
  
  let startY = 0
  let startScrollTop = 0
  let isTouching = false
  let currentElement = null

  /**
   * 处理触摸开始事件
   */
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return
    
    const element = currentElement
    if (!element) return
    
    // 只有在滚动到顶部时才启用下拉刷新
    startScrollTop = element.scrollTop || window.pageYOffset || document.documentElement.scrollTop
    if (startScrollTop > 0) return
    
    startY = e.touches[0].clientY
    isTouching = true
  }

  /**
   * 处理触摸移动事件
   */
  const handleTouchMove = (e) => {
    if (!isTouching || isRefreshing.value) return
    
    const currentY = e.touches[0].clientY
    const diff = currentY - startY
    
    // 只处理向下拉的情况
    if (diff > 0) {
      // 阻止默认滚动行为
      e.preventDefault()
      
      // 计算下拉距离（使用阻尼效果）
      const distance = Math.min(diff * 0.5, maxDistance)
      pullDistance.value = distance
    }
  }

  /**
   * 处理触摸结束事件
   */
  const handleTouchEnd = async () => {
    if (!isTouching) return
    
    isTouching = false
    
    // 如果下拉距离超过阈值，触发刷新
    if (pullDistance.value >= threshold && !isRefreshing.value) {
      isRefreshing.value = true
      
      try {
        if (onRefresh) {
          await onRefresh()
        }
      } catch (error) {
        console.error('刷新失败:', error)
      } finally {
        // 延迟重置状态，让用户看到刷新完成的动画
        setTimeout(() => {
          isRefreshing.value = false
          pullDistance.value = 0
        }, 300)
      }
    } else {
      // 未达到阈值，回弹
      pullDistance.value = 0
    }
  }

  /**
   * 处理触摸取消事件
   */
  const handleTouchCancel = () => {
    isTouching = false
    pullDistance.value = 0
  }

  /**
   * 添加事件监听器
   */
  const addListeners = (element) => {
    if (!element) return
    
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
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
    isRefreshing,
    pullDistance
  }
}
