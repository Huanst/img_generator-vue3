import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useSwipe } from './useSwipe'

// 创建测试组件包装器
const createTestComponent = (options = {}) => {
  return {
    template: '<div ref="target" class="swipe-target"></div>',
    setup() {
      const target = ref(null)
      const swipeResult = useSwipe(target, options)
      return {
        target,
        ...swipeResult
      }
    }
  }
}

describe('useSwipe', () => {
  it('应该正确初始化', async () => {
    const wrapper = mount(createTestComponent())
    await nextTick()
    
    expect(wrapper.vm.isSwiping).toBe(false)
    
    wrapper.unmount()
  })

  it('应该检测左滑手势', async () => {
    const onSwipeLeft = vi.fn()
    const wrapper = mount(createTestComponent({ onSwipeLeft }))
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    // 模拟触摸开始
    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 200, clientY: 100 }],
      bubbles: true
    }))

    // 模拟触摸结束（左滑超过阈值）
    element.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true
    }))

    await nextTick()
    expect(onSwipeLeft).toHaveBeenCalled()
    expect(wrapper.vm.isSwiping).toBe(false)
    
    wrapper.unmount()
  })

  it('应该检测右滑手势', async () => {
    const onSwipeRight = vi.fn()
    const wrapper = mount(createTestComponent({ onSwipeRight }))
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true
    }))

    element.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [{ clientX: 200, clientY: 100 }],
      bubbles: true
    }))

    await nextTick()
    expect(onSwipeRight).toHaveBeenCalled()
    
    wrapper.unmount()
  })

  it('应该检测上滑手势', async () => {
    const onSwipeUp = vi.fn()
    const wrapper = mount(createTestComponent({ onSwipeUp }))
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 200 }],
      bubbles: true
    }))

    element.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true
    }))

    await nextTick()
    expect(onSwipeUp).toHaveBeenCalled()
    
    wrapper.unmount()
  })

  it('应该检测下滑手势', async () => {
    const onSwipeDown = vi.fn()
    const wrapper = mount(createTestComponent({ onSwipeDown }))
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true
    }))

    element.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 200 }],
      bubbles: true
    }))

    await nextTick()
    expect(onSwipeDown).toHaveBeenCalled()
    
    wrapper.unmount()
  })

  it('应该在滑动距离小于阈值时不触发回调', async () => {
    const onSwipeLeft = vi.fn()
    const wrapper = mount(createTestComponent({ onSwipeLeft, threshold: 100 }))
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true
    }))

    element.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [{ clientX: 80, clientY: 100 }],
      bubbles: true
    }))

    await nextTick()
    expect(onSwipeLeft).not.toHaveBeenCalled()
    
    wrapper.unmount()
  })

  it('应该在触摸移动时更新isSwiping状态', async () => {
    const wrapper = mount(createTestComponent())
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true
    }))

    expect(wrapper.vm.isSwiping).toBe(false)

    // 移动超过阈值的一半
    element.dispatchEvent(new TouchEvent('touchmove', {
      touches: [{ clientX: 130, clientY: 100 }],
      bubbles: true
    }))

    await nextTick()
    expect(wrapper.vm.isSwiping).toBe(true)
    
    wrapper.unmount()
  })

  it('应该在touchcancel时重置状态', async () => {
    const wrapper = mount(createTestComponent())
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 }],
      bubbles: true
    }))

    element.dispatchEvent(new TouchEvent('touchmove', {
      touches: [{ clientX: 130, clientY: 100 }],
      bubbles: true
    }))

    await nextTick()
    expect(wrapper.vm.isSwiping).toBe(true)

    element.dispatchEvent(new TouchEvent('touchcancel', {
      bubbles: true
    }))

    await nextTick()
    expect(wrapper.vm.isSwiping).toBe(false)
    
    wrapper.unmount()
  })

  it('应该优先判断主要滑动方向', async () => {
    const onSwipeLeft = vi.fn()
    const onSwipeUp = vi.fn()
    const wrapper = mount(createTestComponent({ onSwipeLeft, onSwipeUp }))
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    // 模拟主要是左滑，但有一点上滑
    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 200, clientY: 100 }],
      bubbles: true
    }))

    element.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 80 }],
      bubbles: true
    }))

    await nextTick()
    expect(onSwipeLeft).toHaveBeenCalled()
    expect(onSwipeUp).not.toHaveBeenCalled()
    
    wrapper.unmount()
  })

  it('应该传递滑动信息给回调函数', async () => {
    const onSwipeLeft = vi.fn()
    const wrapper = mount(createTestComponent({ onSwipeLeft }))
    await nextTick()
    
    const element = wrapper.find('.swipe-target').element

    element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 200, clientY: 100 }],
      bubbles: true
    }))

    element.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 100 }],
      bubbles: true
    }))

    await nextTick()
    expect(onSwipeLeft).toHaveBeenCalledWith(
      expect.objectContaining({
        diffX: expect.any(Number),
        diffY: expect.any(Number),
        velocityX: expect.any(Number),
        velocityY: expect.any(Number)
      })
    )
    
    wrapper.unmount()
  })
})
