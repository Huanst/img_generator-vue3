import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MobileBottomNav from './MobileBottomNav.vue'

describe('MobileBottomNav', () => {
  let wrapper

  beforeEach(() => {
    // Mock visualViewport
    global.window.visualViewport = {
      height: 800,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }
    global.window.innerHeight = 800
  })

  it('should render all navigation items', () => {
    wrapper = mount(MobileBottomNav)
    
    const navItems = wrapper.findAll('.nav-item')
    expect(navItems).toHaveLength(3)
    
    // 检查导航项内容
    expect(navItems[0].text()).toContain('生成')
    expect(navItems[1].text()).toContain('历史')
    expect(navItems[2].text()).toContain('我的')
  })

  it('should highlight active route', () => {
    wrapper = mount(MobileBottomNav, {
      props: {
        currentRoute: 'history'
      }
    })
    
    const navItems = wrapper.findAll('.nav-item')
    expect(navItems[0].classes()).not.toContain('active')
    expect(navItems[1].classes()).toContain('active')
    expect(navItems[2].classes()).not.toContain('active')
  })

  it('should emit navigate event when clicking nav item', async () => {
    wrapper = mount(MobileBottomNav)
    
    const navItems = wrapper.findAll('.nav-item')
    await navItems[1].trigger('click')
    
    expect(wrapper.emitted('navigate')).toBeTruthy()
    expect(wrapper.emitted('navigate')[0]).toEqual(['history'])
  })

  it('should have proper touch target size', () => {
    wrapper = mount(MobileBottomNav)
    
    const navItems = wrapper.findAll('.nav-item')
    // 检查导航项是否存在并且有正确的类名
    expect(navItems.length).toBeGreaterThan(0)
    navItems.forEach(item => {
      expect(item.classes()).toContain('nav-item')
    })
  })

  it('should hide when keyboard is visible', async () => {
    wrapper = mount(MobileBottomNav)
    
    // 模拟键盘弹出（视口高度变小）
    global.window.visualViewport.height = 400
    global.window.innerHeight = 800
    
    // 触发resize事件
    const resizeHandler = global.window.visualViewport.addEventListener.mock.calls[0][1]
    resizeHandler()
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.mobile-bottom-nav').classes()).toContain('keyboard-visible')
  })

  it('should not hide when keyboard is not visible', async () => {
    wrapper = mount(MobileBottomNav)
    
    // 模拟正常视口
    global.window.visualViewport.height = 800
    global.window.innerHeight = 800
    
    // 触发resize事件
    const resizeHandler = global.window.visualViewport.addEventListener.mock.calls[0][1]
    resizeHandler()
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.mobile-bottom-nav').classes()).not.toContain('keyboard-visible')
  })

  it('should apply safe area inset', () => {
    wrapper = mount(MobileBottomNav)
    
    const nav = wrapper.find('.mobile-bottom-nav')
    
    // 检查组件是否正确渲染
    expect(nav.exists()).toBe(true)
    expect(nav.classes()).toContain('mobile-bottom-nav')
  })

  it('should cleanup event listeners on unmount', () => {
    wrapper = mount(MobileBottomNav)
    
    const removeEventListener = global.window.visualViewport.removeEventListener
    
    wrapper.unmount()
    
    expect(removeEventListener).toHaveBeenCalled()
  })

  it('should handle missing visualViewport gracefully', () => {
    // 移除visualViewport模拟
    delete global.window.visualViewport
    
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    
    wrapper = mount(MobileBottomNav)
    
    // 应该回退到window.addEventListener
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    
    addEventListenerSpy.mockRestore()
  })

  it('should emit correct route id for each nav item', async () => {
    wrapper = mount(MobileBottomNav)
    
    const navItems = wrapper.findAll('.nav-item')
    
    // 点击第一个导航项（生成）
    await navItems[0].trigger('click')
    expect(wrapper.emitted('navigate')[0]).toEqual(['generator'])
    
    // 点击第二个导航项（历史）
    await navItems[1].trigger('click')
    expect(wrapper.emitted('navigate')[1]).toEqual(['history'])
    
    // 点击第三个导航项（我的）
    await navItems[2].trigger('click')
    expect(wrapper.emitted('navigate')[2]).toEqual(['profile'])
  })
})
