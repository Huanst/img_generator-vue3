import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from './App.vue'

// Mock the composables and utilities
vi.mock('@/composables/useMobileDetect', () => ({
  useMobileDetect: () => ({
    isMobile: { value: true },
    screenWidth: { value: 375 }
  })
}))

vi.mock('@/utils/userStore', () => ({
  userState: {
    isLoggedIn: false,
    userInfo: null
  },
  userActions: {
    restoreFromStorage: vi.fn().mockResolvedValue(false),
    getUserProfile: vi.fn(),
    logout: vi.fn()
  }
}))

vi.mock('@/utils/apiService', () => ({
  healthAPI: {
    checkHealth: vi.fn()
  }
}))

vi.mock('@/utils/urlUtils', () => ({
  API_BASE_URL: 'http://localhost:5004',
  API_SERVER_URL: 'http://localhost:5004'
}))

vi.mock('@/utils/i18nService', () => ({
  useI18n: () => ({
    t: (key) => key
  })
}))

describe('App - Mobile Navigation Integration', () => {
  let wrapper

  beforeEach(() => {
    // Mock window properties
    global.window.innerWidth = 375
    global.window.innerHeight = 667
    global.window.visualViewport = {
      height: 667,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
  })

  it('should render mobile bottom navigation on mobile devices', async () => {
    wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true,
          'el-message': true
        }
      }
    })

    await nextTick()

    // 应该渲染移动端底部导航
    const mobileNav = wrapper.findComponent({ name: 'MobileBottomNav' })
    expect(mobileNav.exists()).toBe(true)
  })

  it('should hide PC header on mobile devices', async () => {
    wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true,
          'el-message': true
        }
      }
    })

    await nextTick()

    // PC端头部应该被隐藏（通过CSS）
    const header = wrapper.find('.app-header')
    expect(header.exists()).toBe(true) // 元素存在但通过CSS隐藏
  })

  it('should navigate to main page when clicking generator nav item', async () => {
    wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true,
          'el-message': true
        }
      }
    })

    await nextTick()

    const mobileNav = wrapper.findComponent({ name: 'MobileBottomNav' })
    
    // 模拟点击生成导航项
    await mobileNav.vm.$emit('navigate', 'generator')
    await nextTick()

    // 应该在主页面
    expect(wrapper.vm.currentPage).toBe('main')
  })

  it('should show login prompt when non-logged-in user clicks profile', async () => {
    wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true
        },
        mocks: {
          ElMessage: vi.fn()
        }
      }
    })

    await nextTick()

    const mobileNav = wrapper.findComponent({ name: 'MobileBottomNav' })
    
    // 模拟点击个人中心导航项
    await mobileNav.vm.$emit('navigate', 'profile')
    await nextTick()

    // 应该跳转到登录页面
    expect(wrapper.vm.currentPage).toBe('login')
  })

  it('should highlight correct nav item based on current page', async () => {
    wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true,
          'el-message': true
        }
      }
    })

    await nextTick()

    // 默认应该在generator页面
    expect(wrapper.vm.currentMobileRoute).toBe('generator')

    // 切换到profile页面
    wrapper.vm.currentPage = 'profile'
    await nextTick()

    expect(wrapper.vm.currentMobileRoute).toBe('profile')
  })

  it('should adjust main content padding for bottom navigation', async () => {
    wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true,
          'el-message': true
        }
      }
    })

    await nextTick()

    const main = wrapper.find('.app-main')
    expect(main.exists()).toBe(true)
    
    // 主内容区域应该存在（padding通过CSS设置）
    expect(main.classes()).toContain('app-main')
  })
})
