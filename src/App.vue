<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ImageGenerator from './components/ImageGenerator.vue'
import ResultDisplay from './components/ResultDisplay.vue'
import LoginPage from './components/LoginPage.vue'
import RegisterPage from './components/RegisterPage.vue'
import ProfilePage from './components/ProfilePage.vue'
import { userState, userActions } from './utils/userStore'
import { healthAPI } from './utils/apiService'
import { API_BASE_URL, API_SERVER_URL } from './utils/urlUtils'

const generatedImages = ref([])
const errorMessage = ref('')
const isDarkMode = ref(true) // 默认使用深色模式
const currentPage = ref('login') // 当前页面: login, register, main, profile, debug
const showUserMenu = ref(false) // 控制用户菜单显示
const defaultAvatarUrl = ref('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0idXJsKCNncmFkaWVudCkiLz4KICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjE2IiByPSI2IiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC45Ii8+CiAgPHBhdGggZD0iTTggMzJjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOSIvPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM1MzUyZWQ7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAwYzlmZjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgo8L3N2Zz4=')

// 使用用户状态管理（保持响应性）
// 暴露到全局作用域以便调试
window.userState = userState
window.userActions = userActions

// 检测系统主题偏好
const detectSystemTheme = () => {
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  ) {
    isDarkMode.value = false
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    isDarkMode.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
}

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.setAttribute(
    'data-theme',
    isDarkMode.value ? 'dark' : 'light'
  )
}

// 监听系统主题变化
const setupThemeListener = () => {
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    colorSchemeQuery.addEventListener('change', e => {
      isDarkMode.value = e.matches
      document.documentElement.setAttribute(
        'data-theme',
        e.matches ? 'dark' : 'light'
      )
    })
  }
}

// 全局错误处理
const handleGlobalError = event => {
  console.error('全局错误:', event.error || event.message || '未知错误')
  if (event.error && event.error.message) {
    errorMessage.value = `浏览器错误: ${event.error.message}`
  }
}

// 全局Promise错误处理
const handleUnhandledRejection = event => {
  console.error('未处理的Promise错误:', event.reason)
  if (event.reason && event.reason.message) {
    errorMessage.value = `Promise错误: ${event.reason.message}`
  }
}

// 优化鼠标移动处理函数
const handleMouseMove = e => {
  const mouseGlow = document.querySelector('.mouse-glow')
  if (mouseGlow) {
    const x = (e.clientX / window.innerWidth) * 100
    const y = (e.clientY / window.innerHeight) * 100
    mouseGlow.style.setProperty('--mouse-x', `${x}%`)
    mouseGlow.style.setProperty('--mouse-y', `${y}%`)
  }
}

// 用户登录成功处理
const handleLogin = userData => {
  currentPage.value = 'main'
  // 用户状态已在userActions.login中更新
}

// 处理注册成功后的逻辑
const handleRegisterSuccess = data => {
  // 这里可以保存一些注册信息
  console.log('注册成功:', data)
}

// 切换到登录页面
const goToLogin = () => {
  currentPage.value = 'login'
}

// 切换到注册页面
const goToRegister = () => {
  currentPage.value = 'register'
}

// 用户登出
const handleLogout = () => {
  userActions.logout()
  currentPage.value = 'login'
  showUserMenu.value = false
}

// 处理个人中心
const handleProfile = () => {
  currentPage.value = 'profile'
  showUserMenu.value = false
}

// 从个人中心返回主页面
const handleBackFromProfile = () => {
  currentPage.value = 'main'
}

// 处理设置
const handleSettings = () => {
  // 这里可以添加设置页面的逻辑
  console.log('打开设置')
  showUserMenu.value = false
}

// 获取用户头像URL（计算属性，确保响应式更新）
const userAvatarUrl = computed(() => {
  if (userState.userInfo?.avatar_url) {
    // 如果avatar_url已经是完整URL，直接返回
    if (userState.userInfo.avatar_url.startsWith('http')) {
      return userState.userInfo.avatar_url
    }
    // 否则拼接完整URL
    return `${API_SERVER_URL}${userState.userInfo.avatar_url}`
  }
  return defaultAvatarUrl.value
})

// 获取用户头像URL（兼容性方法）
const getUserAvatarUrl = () => {
  return userAvatarUrl.value
}

// 处理头像加载错误
const handleAvatarError = (event) => {
  console.log('头像加载失败，使用默认头像')
  event.target.src = defaultAvatarUrl.value
}

// 检查本地存储的登录信息
const checkStoredLogin = async () => {
  try {
    const restored = await userActions.restoreFromStorage()
    if (restored) {
      currentPage.value = 'main'
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
  }
}

// token验证已集成到userActions中

// 监听全局错误
onMounted(() => {
  window.addEventListener('error', handleGlobalError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
  window.addEventListener('mousemove', handleMouseMove)

  // 检查浏览器兼容性
  if (!window.fetch) {
    console.error('浏览器不支持Fetch API')
    errorMessage.value = '您的浏览器不支持现代Web功能，请升级您的浏览器'
  }

  // 检查剪贴板API可用性
  if (!navigator.clipboard) {
    console.warn('浏览器不支持剪贴板API，复制功能可能不可用')
  }

  // 初始化主题设置
  detectSystemTheme()
  setupThemeListener()

  // 检查存储的登录信息
  checkStoredLogin()
})

// 清理事件监听器
onUnmounted(() => {
  window.removeEventListener('error', handleGlobalError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  window.removeEventListener('mousemove', handleMouseMove)
})

const handleImagesGenerated = data => {
  generatedImages.value = data.data || []
  // 保存图像尺寸信息
  if (data.imageSize) {
    generatedImages.value.imageSize = data.imageSize
  }
  scrollToResults()
}

const handleError = error => {
  errorMessage.value = error.message || '生成图像时发生错误，请稍后再试'
}

const scrollToResults = () => {
  if (generatedImages.value.length) {
    setTimeout(() => {
      const resultsSection = document.querySelector('.results-section')
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 300)
  }
}

// 清空生成的图像结果
const clearGeneratedImages = () => {
  generatedImages.value = []
}
</script>

<template>
  <div class="app-container">
    <!-- 背景层 -->
    <div class="app-background"></div>
    <div class="mouse-glow"></div>

    <div class="content-container">
      <!-- 根据当前页面显示不同内容 -->
      <template v-if="currentPage === 'login'">
        <login-page
          :isDarkMode="isDarkMode"
          @toggleTheme="toggleTheme"
          @login="handleLogin"
          @register="goToRegister" />
      </template>

      <template v-else-if="currentPage === 'register'">
        <register-page
          :isDarkMode="isDarkMode"
          @toggleTheme="toggleTheme"
          @register-success="handleRegisterSuccess"
          @login="goToLogin" />
      </template>

      <template v-else-if="currentPage === 'profile' && userState.isLoggedIn">
        <profile-page
          :isDarkMode="isDarkMode"
          :toggleTheme="toggleTheme"
          @back="handleBackFromProfile" />
      </template>

      <template v-else-if="currentPage === 'main' && userState.isLoggedIn">
        <header class="app-header">
          <div class="user-info">
            <div class="user-avatar-container" @mouseenter="showUserMenu = true" @mouseleave="showUserMenu = false">
              <div class="user-avatar">
                <img :src="userAvatarUrl" 
                     :alt="userState.userInfo?.username" 
                     class="avatar-image"
                     @error="handleAvatarError" />
              </div>
              <transition name="menu-fade">
                <div v-show="showUserMenu" class="user-dropdown-menu">
                  <div class="menu-header">
                    <div class="user-name">{{ userState.userInfo?.username }}</div>
                    <div class="user-email">{{ userState.userInfo?.email || '用户' }}</div>
                  </div>
                  <div class="menu-divider"></div>
                  <div class="menu-items">
                    <div class="menu-item" @click="handleProfile">
                      <i class="icon-user"></i>
                      <span>个人中心</span>
                    </div>
                    <div class="menu-item" @click="handleSettings">
                      <i class="icon-settings"></i>
                      <span>设置</span>
                    </div>
                    <div class="menu-item" @click="toggleTheme">
                      <i :class="isDarkMode ? 'icon-sun' : 'icon-moon'"></i>
                      <span>{{ isDarkMode ? '浅色模式' : '深色模式' }}</span>
                    </div>
                    <div class="menu-divider"></div>
                    <div class="menu-item logout" @click="handleLogout">
                      <i class="icon-logout"></i>
                      <span>退出登录</span>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </header>

        <main class="app-main">
          <transition name="fade">
            <el-alert
              v-if="errorMessage"
              :title="errorMessage"
              type="error"
              show-icon
              class="error-alert"
              @close="errorMessage = ''" />
          </transition>

          <div class="app-sections">
            <div class="generator-section">
              <image-generator
                @images-generated="handleImagesGenerated"
                @error="handleError"
                :isDarkMode="isDarkMode"
                @toggleTheme="toggleTheme" />
            </div>

            <transition name="fade">
              <div class="results-section" v-if="generatedImages.length">
                <result-display
                  :images="generatedImages"
                  :imageSize="generatedImages.imageSize"
                  @close="clearGeneratedImages" />
              </div>
            </transition>
          </div>
        </main>

        <footer class="app-footer" style="margin-top: auto;">
          <p>
            <a
              href="https://beian.miit.gov.cn/#/Integrated/recordQuery"
              target="_blank"
              class="beian-link"
              >滇ICP备2025050068号-1</a
            >
          </p>
          <!-- <p class="footer-powered">
            基于 <span class="highlight">SiliconFlow API</span> 提供技术支持
          </p> -->
        </footer>
      </template>
    </div>
  </div>
</template>

<style>
:root {
  --primary-color: #5352ed;
  --secondary-color: #3498db;
  --accent-color: #00c9ff;
  --background-dark: #10101e;
  --card-bg: rgba(255, 255, 255, 0.07);
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --border-radius: 16px;
  --transition-speed: 0.3s;
  --max-content-width: 1200px;
}

/* 添加亮色模式变量 */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) {
    --primary-color: #4646d9;
    --secondary-color: #2980b9;
    --accent-color: #0078cc;
    --background-dark: #f0f4f8;
    --card-bg: rgba(255, 255, 255, 0.75);
    --text-color: #1a1a2e;
    --text-secondary: rgba(0, 0, 0, 0.65);
    --border-color: rgba(0, 0, 0, 0.1);
  }
}

/* 暗色模式变量 - 手动设置时使用 */
:root[data-theme='dark'] {
  --primary-color: #5352ed;
  --secondary-color: #3498db;
  --accent-color: #00c9ff;
  --background-dark: #10101e;
  --card-bg: rgba(255, 255, 255, 0.07);
  --text-color: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  /* 滑块轨道颜色 - 深色模式 */
  --slider-track-bg: #44475a;
  --slider-track-bg-hover: #555970;
  --border-color: rgba(255, 255, 255, 0.1);
  --background-dark-translucent: rgba(0, 0, 0, 0.5);
  --border-color-translucent: rgba(255, 255, 255, 0.3);
}

/* 亮色模式变量 - 手动设置时使用 */
:root[data-theme='light'] {
  --primary-color: #1976d2;
  --secondary-color: #2196f3;
  --accent-color: #42a5f5;
  --background-dark: #ffffff;
  --card-bg: rgba(255, 255, 255, 0.85);
  --text-color: #2c3e50;
  --text-secondary: rgba(44, 62, 80, 0.7);
  --border-color: rgba(0, 0, 0, 0.08);
  --slider-track-bg: rgba(0, 0, 0, 0.08);
  --slider-track-bg-hover: rgba(0, 0, 0, 0.12);
  --background-dark-translucent: rgba(240, 244, 248, 0.8);
  --border-color-translucent: rgba(0, 0, 0, 0.1);
}

/* 优化卡片玻璃态效果 */
:root[data-theme='light'] .glassmorphic-card {
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px rgba(255, 255, 255, 0.7);
  background: var(--card-bg) !important;
}

/* 重置基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto; /* 确保垂直滚动条在需要时出现 */
}

body {
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* 修复背景和动效 */
#app {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-color);
}

/* 背景渐变 */
.app-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -2;
  background: linear-gradient(
    135deg,
    #e8f4ff 0%,
    #e0f1ff 20%,
    #d8edff 40%,
    #d0eaff 60%,
    #c8e6ff 80%,
    #c0e3ff 100%
  );
  transition: all 0.3s ease;
}

/* 暗色主题背景 */
:root[data-theme='dark'] .app-background {
  background: linear-gradient(
    135deg,
    #1a1f25 0%,
    #23292f 20%,
    #2c333a 40%,
    #353d45 60%,
    #3e474f 80%,
    #475159 100%
  );
}

/* 鼠标光晕效果 */
.mouse-glow {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.7;
  mix-blend-mode: multiply;
  transition: background 0.15s ease;
}

/* 亮色主题下的光晕 */
:root[data-theme='light'] .mouse-glow {
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.12) 0%,
    transparent 50%
  );
}



/* 暗色主题下的光晕 */
:root[data-theme='dark'] .mouse-glow {
  background: radial-gradient(
    circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(255, 255, 255, 0.12) 0%,
    transparent 50%
  );
  mix-blend-mode: soft-light;
}

.content-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.profile-page-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: visible; /* 不设置滚动，允许内容流动 */
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40px 0 10px 0;
  margin-bottom: 30px;
  position: relative;
  z-index: 20;
  height: 80px;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  padding: 0 10px;
  gap: 15px;
}

.user-avatar-container {
  position: relative;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--accent-color);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: block;
}

.user-dropdown-menu {
  position: absolute;
  top: 50px;
  right: 0;
  min-width: 220px;
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1002;
  overflow: hidden;
}

.menu-header {
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.user-email {
  font-size: 12px;
  opacity: 0.9;
}

.menu-items {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  gap: 12px;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item.logout {
  color: #ff6b6b;
}

.menu-item.logout:hover {
  background: rgba(255, 107, 107, 0.1);
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 8px 0;
}

/* 图标样式 */
.icon-user::before { content: '👤'; }
.icon-settings::before { content: '⚙️'; }
.icon-sun::before { content: '☀️'; }
.icon-moon::before { content: '🌙'; }
.icon-logout::before { content: '🚪'; }

/* 菜单动画 */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.3s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.app-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  max-width: 500px;
  margin: 0 auto;
}

.app-main {
  width: 100%;
  position: relative;
  flex: 1;
  padding-bottom: 250px; /* 为底部 footer 留出空间 */
}

.app-sections {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
}

.error-alert {
  margin-bottom: 20px;
  width: 100%;
}

.app-footer {
  text-align: center;
  padding: 15px 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 20px;
  background-color: transparent;
  z-index: 10;
  /* background-color: rgba(0, 0, 0, 0.2); */
}

.footer-powered {
  margin-top: 5px;
  font-size: 0.85rem;
}

.highlight {
  color: var(--accent-color);
  font-weight: 500;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 小屏幕手机 */
@media (max-width: 480px) {
  .app-header {
    padding: 325px 0 15px 0;
    height: 365px;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    border-width: 1px;
  }

  .user-dropdown-menu {
    top: 35px;
    right: 0;
    min-width: 180px;
    z-index: 1002;
  }

  .user-avatar-container {
    z-index: 1001;
  }

  .user-info {
    gap: 8px;
    padding: 0 5px;
  }
}

/* 中等屏幕手机和小平板 */
@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }

  .app-header {
    padding: 345px 0 15px 0;
    height: 385px;
    text-align: center;
  }

  .app-title {
    font-size: 1.8rem;
  }

  .user-dropdown-menu {
    top: 40px;
    right: 5px;
    min-width: 200px;
    z-index: 1002;
  }

  .user-avatar-container {
    z-index: 1001;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-width: 1.5px;
  }

  .user-info {
    gap: 10px;
    padding: 0 8px;
  }

  .app-subtitle {
    font-size: 0.95rem;
  }

  .content-container {
    padding: 15px 10px;
  }

  .app-sections {
    gap: 20px;
  }

  .app-main {
    margin-bottom: 60px;
    padding-bottom: 300px; /* 移动端需要更多底部空间 */
  }

  .app-footer {
    padding: 10px 0;
  }
}

/* 大屏幕平板 */
@media (min-width: 769px) and (max-width: 1023px) {
  .user-avatar {
    width: 38px;
    height: 38px;
  }

  .user-dropdown-menu {
    top: 48px;
    right: 10px;
    min-width: 220px;
    z-index: 1002;
  }

  .user-avatar-container {
    z-index: 1001;
  }
}

@media (min-width: 1024px) {
  .app-sections {
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    width: 100%;
  }

  .generator-section {
    flex: 1;
    max-width: 50%;
    padding-right: 15px;
    display: flex;
    justify-content: flex-end;
  }

  .results-section {
    flex: 1;
    max-width: 50%;
    padding-left: 15px;
    display: flex;
    justify-content: flex-start;
  }

  .generator-section > *,
  .results-section > * {
    width: 100%;
    max-width: 600px;
  }
}

.beian-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s;
  display: inline-block;
  padding: 5px 0;
  background: transparent !important;
}

.beian-link:hover {
  color: var(--accent-color);
}

/* 调试按钮样式 */
.debug-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 优化卡片玻璃态效果 */
.glassmorphic-card {
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  background: var(--card-bg) !important;
}

/* 添加微光效果 */
.glassmorphic-card::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05) 50%,
    transparent 50%,
    transparent
  );
  z-index: -1;
  opacity: 0.5;
}
</style>
