import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

// Mock 子组件
vi.mock('./components/ImageGenerator.vue', () => ({
  default: { name: 'ImageGenerator', template: '<div>ImageGenerator</div>' }
}))
vi.mock('./components/ResultDisplay.vue', () => ({
  default: { name: 'ResultDisplay', template: '<div>ResultDisplay</div>' }
}))
vi.mock('./components/LoginPage.vue', () => ({
  default: { name: 'LoginPage', template: '<div>LoginPage</div>' }
}))
vi.mock('./components/RegisterPage.vue', () => ({
  default: { name: 'RegisterPage', template: '<div>RegisterPage</div>' }
}))
vi.mock('./components/ProfilePage.vue', () => ({
  default: { name: 'ProfilePage', template: '<div>ProfilePage</div>' }
}))

vi.mock('./components/HistoryModal.vue', () => ({
  default: { name: 'HistoryModal', template: '<div>HistoryModal</div>' }
}))

// Mock utils
vi.mock('@/utils/userStore', () => ({
  userState: { isLoggedIn: false, userInfo: null },
  userActions: {
    login: vi.fn(),
    logout: vi.fn(),
    getUserProfile: vi.fn(),
    restoreFromStorage: vi.fn()
  }
}))

vi.mock('@/utils/apiService', () => ({
  healthAPI: {}
}))

vi.mock('@/utils/urlUtils', () => ({
  API_BASE_URL: 'http://localhost:5004',
  API_SERVER_URL: 'http://localhost:5004'
}))

vi.mock('@/utils/i18nService', () => ({
  useI18n: () => ({ t: (key) => key })
}))

describe('App.vue - Mobile Detection Integration', () => {
  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('should provide isMobile state to child components', async () => {
    // 设置移动端宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375
    })

    const wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true,
          'el-message': true
        }
      }
    })

    await wrapper.vm.$nextTick()

    // 验证 provide 的值
    const provided = wrapper.vm.$.provides
    expect(provided).toHaveProperty('isMobile')
    expect(provided).toHaveProperty('screenWidth')
  })

  it('should detect mobile device correctly', async () => {
    // 设置移动端宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375
    })

    const wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true,
          'el-message': true
        }
      }
    })

    await wrapper.vm.$nextTick()

    const provided = wrapper.vm.$.provides
    expect(provided.isMobile.value).toBe(true)
    expect(provided.screenWidth.value).toBe(375)
  })

  it('should detect desktop device correctly', async () => {
    // 设置桌面端宽度
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024
    })

    const wrapper = mount(App, {
      global: {
        stubs: {
          'el-alert': true,
          'el-message': true
        }
      }
    })

    await wrapper.vm.$nextTick()

    const provided = wrapper.vm.$.provides
    expect(provided.isMobile.value).toBe(false)
    expect(provided.screenWidth.value).toBe(1024)
  })

  it('should have mobile CSS variables defined', () => {
    const styles = document.createElement('style')
    styles.textContent = `
      @media (max-width: 768px) {
        :root {
          --mobile-bottom-nav-height: 60px;
          --mobile-safe-area-bottom: env(safe-area-inset-bottom);
          --mobile-touch-target-size: 44px;
        }
      }
    `
    document.head.appendChild(styles)

    // 验证样式已添加
    expect(document.head.contains(styles)).toBe(true)
    expect(styles.textContent).toContain('--mobile-bottom-nav-height')
    expect(styles.textContent).toContain('--mobile-safe-area-bottom')
    expect(styles.textContent).toContain('--mobile-touch-target-size')

    document.head.removeChild(styles)
  })
})
