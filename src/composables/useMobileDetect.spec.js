import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useMobileDetect } from './useMobileDetect'

// 测试组件包装器
const TestComponent = defineComponent({
  props: {
    breakpoint: {
      type: Number,
      default: 768
    }
  },
  setup(props) {
    const { isMobile, screenWidth } = useMobileDetect(props.breakpoint)
    return { isMobile, screenWidth }
  },
  render() {
    return h('div', {}, [
      h('span', { class: 'is-mobile' }, this.isMobile.toString()),
      h('span', { class: 'screen-width' }, this.screenWidth.toString())
    ])
  }
})

describe('useMobileDetect', () => {
  let originalInnerWidth
  let originalLocalStorage
  
  beforeEach(() => {
    // 保存原始值
    originalInnerWidth = window.innerWidth
    originalLocalStorage = window.localStorage
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    // 清除所有 mock
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    // 恢复原始值
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true
    })
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    })
  })
  
  it('should detect mobile when screen width < 768px', async () => {
    // 设置窗口宽度为 375px（移动端）
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    })
    
    const wrapper = mount(TestComponent)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.is-mobile').text()).toBe('true')
    expect(wrapper.find('.screen-width').text()).toBe('375')
  })
  
  it('should detect desktop when screen width >= 768px', async () => {
    // 设置窗口宽度为 1024px（桌面端）
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true
    })
    
    const wrapper = mount(TestComponent)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.is-mobile').text()).toBe('false')
    expect(wrapper.find('.screen-width').text()).toBe('1024')
  })
  
  it('should use custom breakpoint', async () => {
    // 设置窗口宽度为 600px
    Object.defineProperty(window, 'innerWidth', {
      value: 600,
      writable: true
    })
    
    // 使用自定义断点 500px
    const wrapper = mount(TestComponent, {
      props: { breakpoint: 500 }
    })
    await wrapper.vm.$nextTick()
    
    // 600px > 500px，应该是桌面端
    expect(wrapper.find('.is-mobile').text()).toBe('false')
  })
  
  it('should update on window resize', async () => {
    // 初始宽度为桌面端
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true
    })
    
    const wrapper = mount(TestComponent)
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.is-mobile').text()).toBe('false')
    
    // 改变窗口宽度为移动端
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    })
    
    // 触发 resize 事件
    window.dispatchEvent(new Event('resize'))
    
    // 等待防抖延迟
    await new Promise(resolve => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.is-mobile').text()).toBe('true')
  })
  
  it('should save preference to localStorage', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    })
    
    const wrapper = mount(TestComponent)
    await wrapper.vm.$nextTick()
    
    // 验证 localStorage.setItem 被调用
    expect(window.localStorage.setItem).toHaveBeenCalled()
    
    // 验证保存的数据格式
    const calls = window.localStorage.setItem.mock.calls
    const lastCall = calls[calls.length - 1]
    expect(lastCall[0]).toBe('mobile-ui-preference')
    
    const savedData = JSON.parse(lastCall[1])
    expect(savedData).toHaveProperty('isMobile', true)
    expect(savedData).toHaveProperty('screenWidth', 375)
    expect(savedData).toHaveProperty('timestamp')
  })
  
  it('should restore preference from localStorage', async () => {
    // Mock localStorage 返回之前保存的偏好
    const mockPreference = {
      isMobile: true,
      screenWidth: 375,
      timestamp: Date.now()
    }
    window.localStorage.getItem.mockReturnValue(JSON.stringify(mockPreference))
    
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true
    })
    
    const wrapper = mount(TestComponent)
    await wrapper.vm.$nextTick()
    
    // 验证尝试读取 localStorage
    expect(window.localStorage.getItem).toHaveBeenCalledWith('mobile-ui-preference')
  })
  
  it('should handle localStorage errors gracefully', async () => {
    // Mock localStorage 抛出错误
    window.localStorage.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    
    Object.defineProperty(window, 'innerWidth', {
      value: 375,
      writable: true
    })
    
    // 应该不会抛出错误
    expect(() => {
      mount(TestComponent)
    }).not.toThrow()
  })
  
  it('should detect exact breakpoint correctly', async () => {
    // 测试边界值：正好等于断点
    Object.defineProperty(window, 'innerWidth', {
      value: 768,
      writable: true
    })
    
    const wrapper = mount(TestComponent)
    await wrapper.vm.$nextTick()
    
    // 768px >= 768px，应该是桌面端
    expect(wrapper.find('.is-mobile').text()).toBe('false')
  })
})
